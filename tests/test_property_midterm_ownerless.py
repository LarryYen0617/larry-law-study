"""Regression: original property-midterm cards include the teacher-specified first-possession topic."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "content" / "property-midterm-cards.json"
PUBLIC = ROOT / "site" / "property-midterm-cards.js"

class OwnerlessMovableScopeTests(unittest.TestCase):
    def test_source_and_public_copy_are_identical(self):
        source = json.loads(DATA.read_text(encoding="utf-8"))
        payload = PUBLIC.read_text(encoding="utf-8").split("window.LEX_PROPERTY_MIDTERM_CARDS=", 1)[1]
        self.assertEqual(json.JSONDecoder().raw_decode(payload)[0], source)

    def test_ownerless_property_is_not_lost_property(self):
        cards = {c["id"]: c for c in json.loads(DATA.read_text(encoding="utf-8"))["cards"]}
        first = cards["property-midterm-802-20261101"]
        lost = cards["property-midterm-803-20261101"]
        self.assertIn("無主", "".join(first["points"]))
        self.assertIn("所有之意思", "".join(first["points"]))
        self.assertIn("除法令另有規定外", "".join(first["points"]))
        self.assertIn("遺失物仍有所有人", "".join(lost["points"]))
        self.assertIn("交存", "".join(lost["points"]))
        self.assertIn("非教師原題", first["source"])
        self.assertIn("非教師原題", lost["source"])
        for number,card in ((802,first),(803,lost)):
            self.assertTrue(any("flno="+str(number) in ref["url"] for ref in card["refs"]))

if __name__ == "__main__":
    unittest.main()
