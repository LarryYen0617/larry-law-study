import io
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from verify_statute_quotes import verify


class StatuteVerificationTests(unittest.TestCase):
    def question(self, text="民事法律"):
        return {"id": "lawtext-B0000001-1-1", "question": "「民事【空格】」",
                "answer": 0, "options": ["法律"], "sources": [{
                    "url": "https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=B0000001&flno=1",
                    "text": text}]}

    def fetch(self, *args, **kwargs):
        return io.BytesIO('<div class="col-no">第 1 條</div><div class="law-article">民事法律</div>'.encode())

    @patch("verify_statute_quotes.urlopen")
    def test_quote_and_citation_are_separate_checks(self, fetch):
        fetch.side_effect = self.fetch
        report = verify([self.question("民事法律 ::: 訂閱電子報")])
        self.assertEqual(report["counts"]["matched"], 1)
        self.assertEqual(report["citationCounts"]["requires_review"], 1)

    @patch("verify_statute_quotes.urlopen", side_effect=TimeoutError)
    def test_unavailable_is_never_a_pass(self, _):
        report = verify([self.question()])
        self.assertEqual(report["counts"]["unavailable"], 1)
        self.assertEqual(report["citationCounts"]["unavailable"], 1)

    @patch("verify_statute_quotes.urlopen")
    def test_matching_citation(self, fetch):
        fetch.side_effect = self.fetch
        report = verify([self.question()])
        self.assertEqual(report["citationCounts"]["matched"], 1)


if __name__ == "__main__":
    unittest.main()
