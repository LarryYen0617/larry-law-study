#!/usr/bin/env python3
"""Check that the committed search index matches the current HTML source."""
import json
import sys
from pathlib import Path
from importlib.util import spec_from_file_location, module_from_spec

here = Path(__file__).resolve()
spec = spec_from_file_location("search_index_builder", here.with_name("build-search-index.py"))
module = module_from_spec(spec)
spec.loader.exec_module(module)
index_file = module.ROOT / "search-index.json"
try:
    actual = json.loads(index_file.read_text(encoding="utf-8"))
    expected = {"schemaVersion": 1, "pages": module.build()}
except (OSError, ValueError) as exc:
    print(f"Index verification failed: {exc}", file=sys.stderr)
    sys.exit(1)
if actual != expected:
    print("Search index is stale or inconsistent. Run: python3 modernization/scripts/build-search-index.py", file=sys.stderr)
    sys.exit(1)
print(f"Search index verified: {len(expected['pages'])} pages")
