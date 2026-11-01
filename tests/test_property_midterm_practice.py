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
        for article in ("66", "67", "68", "69", "70", "757", "758", "759", "759-1", "760", "761", "802", "803"):
            self.assertIn(article, cited)
        deleted = [q for q in self.questions if str(q[3]) == "760"]
        self.assertEqual(len(deleted), 1)
        self.assertIn("刪除", deleted[0][1][deleted[0][2]])
        for article in ("817", "827", "828", "1148", "1151"):
            self.assertIn(article, cited, "coownership/inheritance coverage missing: " + article)
        # 教師範圍含無主物先占；遺失物不可誤認為無主物。
        ownerless = [q for q in self.questions if str(q[3]) == "802"]
        lost = [q for q in self.questions if str(q[3]) == "803"]
        self.assertEqual(len(ownerless), 1)
        self.assertEqual(len(lost), 1)
        self.assertIn("所有之意思", ownerless[0][0])
        self.assertIn("法令另有規定", ownerless[0][4])
        self.assertIn("學校管理機關", lost[0][1][lost[0][2]])
        self.assertIn("並非無主動產", lost[0][4])
        self.assertIn("案例三：兩名繼承人", self.html)
        self.assertIn("全國法規資料庫", self.html)

    def test_answer_progress_and_review_navigation(self):
        self.assertIn('id="progress"', self.html)
        self.assertIn('form.addEventListener("change",()=>{', self.html)
        self.assertIn('if(graded){', self.html)
        self.assertIn('resetFeedback("答案已變更，原成績失效；請重新交卷查看更新結果。")', self.html)
        self.assertIn('articleLabel(row[3])', self.html)
        self.assertIn('updateProgress();document.querySelector("#question-1 input").focus()', self.html)
        self.assertIn('nav.setAttribute("aria-label","待複習題目")', self.html)
        self.assertIn('link.href="#question-"+item.number', self.html)
        self.assertIn('missed.push({number:i+1,unanswered:actual<0})', self.html)
        self.assertIn('min-height:44px', self.html)

    def test_question_map_is_accessible_and_tracks_answered_state(self):
        self.assertIn('id="question-map"', self.html)
        self.assertIn('aria-label="題目快速導覽"', self.html)
        self.assertIn('id="next-unanswered"', self.html)
        self.assertIn('grid-template-columns:repeat(auto-fill,minmax(3.25rem,1fr))', self.html)
        self.assertIn('jump.href="#question-"+(i+1)', self.html)
        self.assertIn('jump.dataset.answered=String(done)', self.html)
        self.assertIn('jump.setAttribute("aria-label","跳至第"+(i+1)+"題（"+(done?"已作答":"未作答")+"）")', self.html)
        self.assertIn('target.querySelector("input").focus({preventScroll:true})', self.html)
        self.assertIn('if(first<0){form.querySelector(\'button[type="submit"]\').focus();return;}', self.html)
        self.assertIn('updateProgress();\n</script>', self.html)

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
