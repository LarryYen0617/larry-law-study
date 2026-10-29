"""Validate the final upload artifact after every content publisher has run."""
import json
from pathlib import Path
from public_learning import validate_public_knowledge

path = Path(__file__).resolve().parents[1] / "site/knowledge-data.js"
payload = path.read_text(encoding="utf-8").strip()
prefix = "window.LEX_KNOWLEDGE = "
if not payload.startswith(prefix) or not payload.endswith(";"):
    raise ValueError("Unexpected public knowledge format")
validate_public_knowledge(json.loads(payload[len(prefix):-1]))
print("PASS: final public knowledge artifact contains no source-only case fields.")
