"""Regression: Civil Code 66(2) and keyboard-friendly 25-question mock exam."""
import json
import re
import unittest
from pathlib import Path

PAGE = Path(__file__).resolve().parents[1] / "site" / "property-midterm-practice.html"


class PropertyMidtermUnseveredTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = PAGE.read_text(encoding="utf-8")
        payload = re.search(
            r'<script id="question-bank" type="application/json">([\\s\\S]*?)</script>',
            cls.html,
        )
        if payload is None:
            raise AssertionError("Original 25-question bank missing")
        cls.questions = json.loads(payload.group(1))

    def test_original_scored_exam_stays_at_25_unique_single_choice_questions(self):
        self.assertEqual(len(self.questions), 25)
        self.assertEqual(len({row[0] for row in self.questions}), 25)
        for stem, choices, correct, article, explanation in self.questions:
            self.assertEqual(len(choices), 4, stem)
            self.assertEqual(len(set(choices)), 4, stem)
            self.assertIsInstance(correct, int)
            self.assertIn(correct, range(4))
            self.assertTrue(article)
            self.assertTrue(explanation)

    def test_civil_code_66_unsevered_produce_is_explained_without_extra_score(self):
        self.assertIn('id="unsevered-produce"', self.html)
        self.assertIn('民法第66條第2項', self.html)
        self.assertIn('尚未採摘', self.html)
        self.assertIn('土地買賣契約成立不代表所有權已登記移轉', self.html)
        self.assertIn('不計分的補充案例', self.html)
        self.assertIn('flno=66', self.html)
        self.assertIn('flno=758', self.html)

    def test_question_map_moves_focus_into_selected_question(self):
        self.assertIn('questionMap.addEventListener("click"', self.html)
        self.assertIn('link.hash.slice(1)', self.html)
        self.assertIn('querySelector("input")?.focus({preventScroll:true})', self.html)


if __name__ == "__main__":
    unittest.main()
