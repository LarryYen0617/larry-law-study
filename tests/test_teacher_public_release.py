"""Release-only teacher source isolation: no canonical imports are removed."""
import base64
import json
from urllib.parse import quote
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

    def test_escaped_original_answer_in_public_assets_blocks_release(self):
        originals = sanitize(self.site)
        self.index()
        answer = originals[0]["answer"]
        for filename, encoded in (
            ("data.js", "".join("\\u%04x" % ord(ch) for ch in answer)),
            ("diagram.svg", quote(answer, safe="")),
            ("app.js.map", quote(quote(answer, safe=""), safe="")),
        ):
            with self.subTest(filename=filename):
                path = self.site / filename
                path.write_text(encoded, encoding="utf-8")
                with self.assertRaisesRegex(ValueError, "Restricted teacher text"):
                    validate_public(self.site, originals)
                path.unlink()

    def test_base64_encoded_teacher_question_and_answer_block_release(self):
        originals = sanitize(self.site)
        self.index()
        for field in ("question", "answer"):
            for encoder in (base64.b64encode, base64.urlsafe_b64encode):
                padded = encoder(originals[0][field].encode("utf-8")).decode("ascii")
                self.assertNotEqual(padded, padded.rstrip("="), "fixture must require padding")
                for encoded in (padded, padded.rstrip("=")):
                    with self.subTest(field=field, encoder=encoder.__name__, padded=encoded == padded):
                        path = self.site / "leak.js"
                        path.write_text(encoded, encoding="utf-8")
                        with self.assertRaisesRegex(ValueError, "Restricted teacher text"):
                            validate_public(self.site, originals)
                        path.unlink()

    def test_medium_length_originals_are_not_exempt(self):
        originals = sanitize(self.site)
        self.index()
        for field in ("question", "answer"):
            # Previously these 50-character originals bypassed the 80-char gate.
            originals[0][field] = ("Private " + field + " ") + "X" * 50
            (self.site / "short-leak.js").write_text(
                originals[0][field], encoding="utf-8")
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, "Restricted teacher text"):
                validate_public(self.site, originals)
            (self.site / "short-leak.js").unlink()

    def test_long_original_excerpts_block_release(self):
        originals = sanitize(self.site)
        self.index()
        originals[0]["question"] = "START" + "Q" * 100 + "MIDDLE" + "R" * 100 + "END"
        excerpt = originals[0]["question"][60:160]
        (self.site / "excerpt.js").write_text(excerpt, encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Restricted teacher text"):
            validate_public(self.site, originals)

    def test_off_center_teacher_excerpt_blocks_release(self):
        originals = sanitize(self.site)
        self.index()
        originals[0]["question"] = "前" * 80 + "中" * 120 + "後" * 80
        excerpt = originals[0]["question"][75:155]
        (self.site / "off-center-excerpt.js").write_text(excerpt, encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Restricted teacher text"):
            validate_public(self.site, originals)

    def test_whitespace_wrapped_teacher_answer_blocks_release(self):
        originals = sanitize(self.site)
        self.index()
        answer = originals[0]["answer"]
        (self.site / "wrapped.js").write_text(" \\n ".join(answer), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Restricted teacher text"):
            validate_public(self.site, originals)

    def test_nfkc_equivalent_teacher_question_blocks_release(self):
        originals = sanitize(self.site)
        self.index()
        originals[0]["question"] = "ＡＢＣ１２３－" * 15
        (self.site / "normalized.js").write_text("ABC123-" * 15, encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Restricted teacher text"):
            validate_public(self.site, originals)

    def test_inventory_changes_fail_closed(self):
        (self.site / "library-teacher-05.js").write_text(
            "window.LEX_LIBRARY.teacherQuestions.push(...[]);", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "inventory changed"):
            sanitize(self.site)


if __name__ == "__main__":
    unittest.main()
