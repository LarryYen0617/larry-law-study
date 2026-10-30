"""Fail closed when private teacher source text reaches the public Pages artifact.

Only the site/ tree is deployed. The original source stays unchanged; error
messages intentionally contain file paths and case IDs, never private prompts.
"""
from pathlib import Path

TEXT_EXTENSIONS = frozenset({".html", ".js", ".json", ".txt", ".xml", ".md", ".css"})


def validate_public_site_text(source, site_root):
    markers = []
    for case in source.get("cases", []):
        if not isinstance(case, dict):
            continue
        case_id = str(case.get("id", "unknown"))
        prompt = case.get("originalQuestion")
        if isinstance(prompt, str) and len(prompt.strip()) >= 40:
            markers.append((case_id, prompt.strip()))
        for field in ("originalQuestionSha256", "originalFileSha256"):
            digest = case.get(field)
            if (isinstance(digest, str) and len(digest) == 64
                    and all(ch in "0123456789abcdefABCDEF" for ch in digest)):
                markers.append((case_id, digest))
    if not markers:
        return 0
    root = Path(site_root)
    checked = 0
    for path in root.rglob("*"):
        if not path.is_file() or path.is_symlink() or path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        content = path.read_text(encoding="utf-8")
        checked += 1
        for case_id, needle in markers:
            if needle in content:
                relative = path.relative_to(root)
                raise ValueError(
                    f"Private source-only case material in public artifact {relative} (case {case_id})"
                )
    return checked
