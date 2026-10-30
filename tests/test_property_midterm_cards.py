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
        payload = script.split(prefix, 1)[1]
        self.assertEqual(json.JSONDecoder().raw_decode(payload)[0], source)

    def test_movable_accessories_and_fruits_have_distinct_rules(self):
        cards = {card["id"].split("-20261030")[0]: card for card in json.loads(SOURCE.read_text(encoding="utf-8"))["cards"]}
        for article in (67, 68, 69, 70):
            self.assertIn(f"property-midterm-{article}", cards)
        self.assertIn("非主物的成分", "".join(cards["property-midterm-68"]["points"]))
        self.assertIn("交易上有特別習慣", "".join(cards["property-midterm-68"]["points"]))
        self.assertIn("租金", "".join(cards["property-midterm-69"]["points"]))
        self.assertIn("分離時", "".join(cards["property-midterm-70"]["points"]))
        self.assertIn("日數", "".join(cards["property-midterm-70"]["points"]))

    def test_current_statute_status_and_provenance(self):
        source = json.loads(SOURCE.read_text(encoding="utf-8"))
        cards = source["cards"]
        ids = [card["id"] for card in cards]
        self.assertEqual(len(ids), len(set(ids)))
        for article in (66, 67, 68, 69, 70, 757, 758, 759, 760, 761):
            self.assertTrue(any(card["id"].startswith(f"property-midterm-{article}-") for card in cards), article)
        self.assertTrue(any(card["id"].startswith("property-midterm-759-1-") for card in cards))
        deleted = next(card for card in cards if card["id"] == "property-midterm-760-20261030")
        self.assertIn("刪除", deleted["title"])
        for card in cards:
            self.assertIn("非教師原題", card["source"])
            self.assertNotIn("originalQuestion", card)
            for ref in card["refs"]:
                self.assertTrue(ref["url"].startswith("https://law.moj.gov.tw/LawClass/LawSingle.aspx?"))


    def test_inheritance_and_coownership_midterm_scope(self):
        source = json.loads(SOURCE.read_text(encoding="utf-8"))
        cards = {card["id"]: card for card in source["cards"]}
        required = (817, 827, 828, 1148, 1151)
        for article in required:
            key = f"property-midterm-{article}-20261031"
            self.assertIn(key, cards)
            self.assertTrue(any(f"flno={article}" in ref["url"] for ref in cards[key]["refs"]))
        case = cards["property-midterm-case-inheritance-20261031"]
        self.assertIn("自編申論案例", case["title"])
        self.assertIn("公同共有", " ".join(case["points"]))
        self.assertIn("第759條", " ".join(case["points"]))
        self.assertEqual(len(source["cards"]), len(set(card["id"] for card in source["cards"])))
        for card in [*(cards[f"property-midterm-{n}-20261031"] for n in required), case]:
            self.assertIn("非教師原題", card["source"])

if __name__ == "__main__":
    unittest.main()
