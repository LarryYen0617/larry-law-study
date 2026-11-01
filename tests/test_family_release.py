import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from authorized_family_release import authorized_family_page, FAMILY_PAGE


class FamilyReleaseTests(unittest.TestCase):
    def test_exact_authorized_page_and_tampering(self):
        site = Path(__file__).resolve().parents[1] / "site"
        original = site / FAMILY_PAGE
        self.assertTrue(authorized_family_page(original, site))
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            page = root / FAMILY_PAGE
            page.parent.mkdir()
            page.write_bytes(original.read_bytes() + b"<!-- changed -->")
            with self.assertRaisesRegex(ValueError, "changed"):
                authorized_family_page(page, root)
            other = root / "other.html"
            other.write_bytes(original.read_bytes())
            self.assertFalse(authorized_family_page(other, root))
