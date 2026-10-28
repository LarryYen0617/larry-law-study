#!/usr/bin/env python3
"""Aggregate subject coverage from the public search index; no content is exported."""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "site" / "search-index.json"
SUBJECTS = {
    "crime": "刑法分則", "family": "親屬法", "debt": "債權",
    "property": "物權", "admin": "行政法", "tax": "租稅法",
    "criminalgeneral": "刑法總則", "civilgeneral": "民法總則",
    "constitution": "憲法",
}
def summarize(items):
    summary = {}
    for code, name in SUBJECTS.items():
        rows = [item for item in items if isinstance(item, dict) and item.get("subject") == code]
        kinds = Counter(item.get("type") for item in rows)
        summary[code] = {"name": name, "total": len(rows),
                         "questions": kinds["question"], "teacher": kinds["teacher"],
                         "notes": kinds["note"], "other": len(rows)-kinds["question"]-kinds["teacher"]-kinds["note"]}
    return summary

if __name__ == "__main__":
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    summary = summarize(data["items"])
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    output = ROOT / "coverage-report.json"
    output.write_text(json.dumps({"index_records": len(data["items"]), "subjects": summary}, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
