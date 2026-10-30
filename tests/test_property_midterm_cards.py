import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content" / "property-midterm-cards.json"
SITE = ROOT / "site" / "property-midterm-cards.js"

class PropertyMidtermCardsTests(unittest.TestCase):
    def test_public_cards_match_reviewed_source(self):
        source = json.loads(SOURCE.read_text(encoding="utf-8"))
        script = SITE.read_text(encoding="utf-8")
        prefix = "window.LEX_PROPERTY_MIDTERM_CARDS="
        self.assertIn(prefix, script)
        payload = script.split(prefix, 1)[1].split(";\\n(function(){", 1)[0]
        self.assertEqual(json.loads(payload), source)

    def test_current_statute_status_and_provenance(self):
        source = json.loads(SOURCE.read_text(encoding="utf-8"))
        cards = source["cards"]
        ids = [card["id"] for card in cards]
        self.assertEqual(len(ids), len(set(ids)))
        for article in (66, 757, 758, 759, 760, 761):
            self.assertTrue(any(str(article) in card["id"] for card in cards), article)
        deleted = next(card for card in cards if card["id"] == "property-midterm-760-20261030")
        self.assertIn("刪除", deleted["title"])
        for card in cards:
            self.assertIn("非教師原題", card["source"])
            self.assertNotIn("originalQuestion", card)
            for ref in card["refs"]:
                self.assertTrue(ref["url"].startswith("https://law.moj.gov.tw/LawClass/LawSingle.aspx?"))

if __name__ == "__main__":
    unittest.main()
