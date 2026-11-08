"""Withhold the retired novel from the final Pages artifact; retain source history."""
import json
import shutil
from pathlib import Path

BOOK = "wan-jie-fa-shen"


def unpublish(site):
    site = Path(site).resolve()
    catalog_path = site / "books/catalog.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    catalog_path.write_text(json.dumps([b for b in catalog if b["id"] != BOOK], ensure_ascii=False) + "\n", encoding="utf-8")
    index_path = site / "search-index.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    index["items"] = [row for row in index["items"] if not (
        row.get("id", "").startswith(f"novel:{BOOK}-") or BOOK in row.get("href", ""))]
    index_path.write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    target = (site / "books" / BOOK).resolve()
    if target.parent != site / "books":
        raise ValueError("Novel path escapes the Pages books directory")
    if target.exists():
        shutil.rmtree(target)
    assert not target.exists()
    assert all(b["id"] != BOOK for b in json.loads(catalog_path.read_text(encoding="utf-8")))
    assert BOOK not in index_path.read_text(encoding="utf-8")
    print("PASS: retired novel removed from Pages catalog, search and chapter files; source manuscript retained")


if __name__ == "__main__":
    unpublish(Path(__file__).resolve().parents[1] / "site")
