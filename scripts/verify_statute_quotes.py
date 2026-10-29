"""Verify the rendered question corpus against current official statute pages.

This checks quotations only; it never certifies case application or exam scope.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
from urllib.request import urlopen
from urllib.parse import urlsplit, parse_qs

from build_note_laws import Articles

ROOT = Path(__file__).resolve().parents[1]


def verify(questions):
    candidates = []
    citations = []
    for question in questions:
        for source in question.get("sources", []):
            url = urlsplit(source.get("url", ""))
            params = {key.lower(): value[0] for key, value in parse_qs(url.query).items()}
            code, article = params.get("pcode", "").upper(), params.get("flno", "")
            if url.hostname == "law.moj.gov.tw" and re.fullmatch(r"[A-Z][0-9]{7}", code) and re.fullmatch(r"\d+(?:-\d+)?", article) and source.get("text"):
                citations.append((question["id"], code, article, source["text"]))
        match = re.fullmatch(r"lawtext-([A-Z][0-9]{7})-(\d+(?:-\d+)?)-(\d+)", question["id"])
        quote = re.search(r"「(.*?)」", question.get("question", ""), re.S)
        if match and quote and "【空格】" in quote[1]:
            code, article, _ = match.groups()
            candidates.append((question, code, article, quote[1]))

    def fetch(code):
        url = "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=" + code
        try:
            raw = urlopen(url, timeout=30).read()
            parser = Articles()
            parser.feed(raw.decode("utf-8-sig"))
            if not parser.rows:
                raise ValueError("Official page contains no parsed articles")
            return code, {"url": url, "sha256": hashlib.sha256(raw).hexdigest(), "articles": parser.rows}
        except Exception as error:
            return code, {"url": url, "error": type(error).__name__}

    with ThreadPoolExecutor(max_workers=3) as pool:
        pages = dict(pool.map(fetch, sorted({row[1] for row in candidates + citations})))
    normalize = lambda text: re.sub(r"\s+", "", text)
    results = []
    for question, code, article, quote in candidates:
        source = pages[code]
        row = {"id": question["id"], "code": code, "article": article, "url": source["url"]}
        try:
            restored = quote.replace("【空格】", question["options"][question["answer"]])
            official = source.get("articles", {}).get(article)
            row["status"] = "unavailable" if not official else "matched" if normalize(restored) in normalize(official) else "mismatch"
            if row["status"] == "mismatch":
                row["quotation"] = restored
            if code == "B0000001" and article in ("166-1", "1223"):
                row["applicationStatus"] = "requires_effective_date_check"
        except (IndexError, KeyError, TypeError):
            row["status"] = "invalid_question"
        results.append(row)
    counts = {status: sum(row["status"] == status for row in results) for status in ("matched", "mismatch", "unavailable", "invalid_question")}
    citation_results = []
    for item_id, code, article, text in citations:
        official = pages[code].get("articles", {}).get(article)
        row = {"id": item_id, "code": code, "article": article,
               "status": "unavailable" if not official else "matched" if normalize(text) in normalize(official) else "requires_review"}
        if row["status"] == "requires_review":
            row["citationText"] = text
        if code == "B0000001" and article in ("166-1", "1223"):
            row["applicationStatus"] = "requires_effective_date_check"
        citation_results.append(row)
    return {"checkedAt": datetime.now(timezone.utc).isoformat(), "questionsInCorpus": len(questions),
            "quoteQuestions": len(results), "counts": counts, "citationResults": citation_results,
            "citationCounts": {status: sum(row["status"] == status for row in citation_results) for status in ("matched", "requires_review", "unavailable")},
            "scope": "逐字引文比對；不代表全部題目法律適用、學說、裁判或教師考試範圍已審定。最新公布文字與已施行文字須另分辨。",
            "sources": {code: {key: value for key, value in page.items() if key != "articles"} for code, page in pages.items()},
            "results": results}


if __name__ == "__main__":
    args = argparse.ArgumentParser()
    args.add_argument("--questions", type=Path, required=True)
    args.add_argument("--output", type=Path, default=ROOT / "content/maintenance/statute-quotes-current.json")
    options = args.parse_args()
    report = verify(json.loads(options.questions.read_text(encoding="utf-8")))
    options.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: report[key] for key in ("questionsInCorpus", "quoteQuestions", "counts", "citationCounts")}, ensure_ascii=False))
    raise SystemExit(any(report["counts"][key] for key in ("mismatch", "unavailable", "invalid_question")) or
                     any(report["citationCounts"][key] for key in ("requires_review", "unavailable")))
