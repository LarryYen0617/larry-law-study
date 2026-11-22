"""Package the authorized draft edition for the Reading Room."""
import json
import re
import subprocess
from pathlib import Path

SOURCE = "a0e499fc1c6da85255db4962c9a84a46d5ce8040"
SOURCE_DIR = "drafts/zhu-tian-wan-jie/v2"
BOOK_ID = "zhu-tian-wan-jie-v2"
BASE = f"books/{BOOK_ID}/"
CHAPTER_COUNT = 174
PART_SIZE = 10
EDITED_CHAPTERS = {3}
# Chapter 147 was already published before the minimum length check.
LEGACY_SHORT_CHAPTERS = {147}


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


def publish(site):
    chapters = []
    parts = {}
    for number in range(1, CHAPTER_COUNT + 1):
        source = f"{SOURCE}:{SOURCE_DIR}/chapter-{number:03d}.md"
        if number in EDITED_CHAPTERS:
            path = site.parent / SOURCE_DIR / f"chapter-{number:03d}.md"
            markdown = path.read_text(encoding="utf-8")
        else:
            markdown = subprocess.check_output(["git", "show", source], encoding="utf-8")
        markdown = re.sub(r"<!--.*?-->", "", markdown, flags=re.S)
        headings = re.findall(r"^#{1,3}\s+([^\n]+)$", markdown, re.M)
        title = next((h.strip() for h in headings if re.match(r"第.{1,12}章", h)), None)
        body = re.sub(r"^#{1,6}[^\n]*$", "", markdown, flags=re.M).strip()
        if not title or not body or len(body) >= 200_000:
            raise ValueError(f"Invalid chapter for the reader: {source}")
        if number not in LEGACY_SHORT_CHAPTERS and len(re.findall(r"[\u3400-\u9fff]", body)) < 3000:
            raise ValueError(f"Chapter body is below 3000 Han characters: {source}")
        part = f"chapters-{(number - 1) // PART_SIZE * PART_SIZE + 1:03d}.json"
        chapters.append({"number": number, "title": title, "part": part})
        parts.setdefault(part, []).append({"number": number, "text": body})

    directory = site / BASE
    directory.mkdir(parents=True, exist_ok=True)
    for part, rows in parts.items():
        write_json(directory / part, rows)
    write_json(directory / "manifest.json", {"chapters": chapters})

    catalog_path = site / "books/catalog.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    catalog = [book for book in catalog if book["id"] != BOOK_ID]
    catalog.append({
        "id": BOOK_ID,
        "title": "諸天萬界",
        "subtitle": "新版試閱 · 草稿待校訂",
        "chapterCount": CHAPTER_COUNT,
        "kind": "novel",
        "published": True,
        "base": BASE,
    })
    write_json(catalog_path, catalog)
    print(f"PASS: packaged {len(chapters)} chapters in {len(parts)} parts from {SOURCE}")


if __name__ == "__main__":
    publish(Path(__file__).resolve().parents[1] / "site")
