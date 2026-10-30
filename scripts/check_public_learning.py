"""Validate the final upload artifact after every content publisher has run."""
import json
from pathlib import Path
from public_learning import validate_public_knowledge
from check_public_source_leak import validate_public_site_text
from public_novel_index import validate_novel_index

path = Path(__file__).resolve().parents[1] / "site/knowledge-data.js"
payload = path.read_text(encoding="utf-8").strip()
prefix = "window.LEX_KNOWLEDGE = "
if not payload.startswith(prefix) or not payload.endswith(";"):
    raise ValueError("Unexpected public knowledge format")
validate_public_knowledge(json.loads(payload[len(prefix):-1]))
source = json.loads((path.parent.parent / "content/knowledge-base.json").read_text(encoding="utf-8"))
checked = validate_public_site_text(source, path.parent)
manifest = json.loads((path.parent / "books/wan-jie-fa-shen/manifest.json").read_text(encoding="utf-8"))
index = json.loads((path.parent / "search-index.json").read_text(encoding="utf-8"))
novel_count = validate_novel_index(manifest, index)
print(f"PASS: public knowledge fields, {checked} text artifacts, and {novel_count} published novel search entries verified.")
