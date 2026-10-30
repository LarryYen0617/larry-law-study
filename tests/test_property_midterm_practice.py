"""物權期中原創模擬題：題量、法源、單選與公開安全檢查。"""
import json
import re
from pathlib import Path
import unittest

PAGE = (Path(__file__).resolve().parents[1] / "site" / "property-midterm-practice.html")

class PropertyMidtermPracticeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = PAGE.read_text(encoding="utf-8")
        match = re.search(r'<script id="question-bank" type="application/json">([\s\S]*?)</script>', cls.html)
        assert match, "question bank must be embedded as non-executable JSON"
        cls.questions = json.loads(match.group(1))

    def test_exactly_25_original_single_choice_questions(self):
        self.assertEqual(len(self.questions), 25)
        prompts = set()
        for prompt, options, answer, article, explanation in self.questions:
            self.assertNotIn(prompt, prompts)
            prompts.add(prompt)
            self.assertEqual(len(options), 4)
            self.assertEqual(len(options), len(set(options)))
            self.assertIsInstance(answer, int)
            self.assertIn(answer, range(4))
            self.assertTrue(article and explanation)
            self.assertGreaterEqual(len(explanation), 15)

    def test_statute_coverage_and_no_deleted_statute_misquote(self):
        cited = {str(q[3]) for q in self.questions}
        for article in ("66", "67", "68", "69", "70", "757", "758", "759", "759-1", "760", "761"):
            self.assertIn(article, cited)
        deleted = [q for q in self.questions if str(q[3]) == "760"]
        self.assertEqual(len(deleted), 1)
        self.assertIn("刪除", deleted[0][1][deleted[0][2]])
        self.assertIn("全國法規資料庫", self.html)

    def test_answer_progress_and_review_navigation(self):
        self.assertIn('id="progress"', self.html)
        self.assertIn('form.addEventListener("change",updateProgress)', self.html)
        self.assertIn('updateProgress();document.querySelector("#question-1 input").focus()', self.html)
        self.assertIn('nav.setAttribute("aria-label","待複習題目")', self.html)
        self.assertIn('link.href="#question-"+item.number', self.html)
        self.assertIn('missed.push({number:i+1,unanswered:actual<0})', self.html)
        self.assertIn('min-height:44px', self.html)

    def test_accessible_and_privacy_safe(self):
        self.assertIn('<form id="exam">', self.html)
        self.assertIn('radio.type="radio"', self.html)
        self.assertIn('aria-live="polite"', self.html)
        self.assertIn("不是教師原題", self.html)
        self.assertNotIn("localStorage", self.html)
        self.assertNotIn("fetch(", self.html)
        self.assertIn("申論延伸", self.html)

if __name__ == "__main__":
    unittest.main()
