"""Release-only teacher source isolation: no canonical imports are removed."""
import json
import tempfile
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from prepare_public_teacher_archive import sanitize, validate_public


class TeacherPublicReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.site = Path(self.temp.name)
        self.originals = [
            {"id": f"teacher-{i}", "question": f"Question {i} " + "q" * 90,
             "answer": "Answer " + "a" * 100, "source": "teacher.pdf"}
            for i in range(91)
        ]
        for i in range(5):
            chunk = self.originals[i * 19:(i + 1) * 19] if i < 4 else self.originals[76:]
            prefix = "window.LEX_LIBRARY.teacherQuestions=[];\n" if i == 0 else ""
            (self.site / f"library-teacher-{i + 1:02}.js").write_text(
                prefix + "window.LEX_LIBRARY.teacherQuestions.push(..." +
                json.dumps(chunk) + ");\n", encoding="utf-8")
        (self.site / "library.js").write_text(
            "let teacherFilter='original';"
            "[['original','老師原題'],['authored','補充自編題'],['all','全部']]",
            encoding="utf-8")
        (self.site / "library.html").write_text("課堂原題與擬答", encoding="utf-8")

    def tearDown(self):
        self.temp.cleanup()

    def index(self, include_original=False):
        items = [{"id": f"note:{i}", "type": "note"} for i in range(3602)]
        items.extend({"id": f"teacher:authored-{i}", "type": "teacher"} for i in range(18))
        if include_original:
            items.append({"id": "teacher:teacher-0", "type": "teacher"})
        (self.site / "search-index.json").write_text(
            json.dumps({"version": 1, "items": items}), encoding="utf-8")

    def test_public_build_keeps_authored_cases_and_hides_originals(self):
        originals = sanitize(self.site)
        self.index()
        self.assertEqual(len(originals), 91)
        self.assertEqual(validate_public(self.site, originals)[:2], (3620, 18))
        self.assertIn("teacherFilter='authored'", (self.site / "library.js").read_text())
        self.assertIn("課堂案例與自編擬答", (self.site / "library.html").read_text())
        self.assertNotIn("Question 0", (self.site / "library-teacher-01.js").read_text())

    def test_original_search_result_blocks_release(self):
        originals = sanitize(self.site)
        self.index(include_original=True)
        with self.assertRaisesRegex(ValueError, "Private teacher item"):
            validate_public(self.site, originals)

    def test_verbatim_teacher_text_blocks_release(self):
        originals = sanitize(self.site)
        self.index()
        (self.site / "leak.js").write_text(originals[0]["question"], encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Restricted teacher text"):
            validate_public(self.site, originals)

    def test_inventory_changes_fail_closed(self):
        (self.site / "library-teacher-05.js").write_text(
            "window.LEX_LIBRARY.teacherQuestions.push(...[]);", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "inventory changed"):
            sanitize(self.site)


if __name__ == "__main__":
    unittest.main()
