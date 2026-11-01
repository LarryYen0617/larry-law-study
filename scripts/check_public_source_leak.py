"""Fail closed when private teacher source text reaches the public Pages artifact.

Only the site/ tree is deployed. The original source stays unchanged; error
messages intentionally contain file paths and case IDs, never private prompts.
"""
import base64
import html
import re
import unicodedata
from pathlib import Path
from urllib.parse import unquote

# Include all textual assets served by Pages, including SVG and source maps.
TEXT_EXTENSIONS = frozenset({
    ".html", ".js", ".json", ".txt", ".xml", ".md", ".css",
    ".svg", ".map", ".webmanifest", ".csv", ".vtt", ".srt",
})
JS_HEX_ESCAPE = re.compile(r"\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})")


def _decoded_public_text(content):
    """Inspect escaped public strings without executing or evaluating scripts."""
    # A source string may be wrapped more than once (for example, a URL-
    # encoded HTML entity). Inspect up to four decoding layers so that a
    # second layer cannot bypass the release gate; never evaluate JS.
    def replace_hex(match):
        code = int(next(group for group in match.groups() if group is not None), 16)
        return chr(code) if code <= 0x10FFFF else match.group(0)

    decoded = content
    for _ in range(4):
        next_text = unquote(html.unescape(decoded))
        next_text = JS_HEX_ESCAPE.sub(replace_hex, next_text)
        next_text = (next_text.replace(r'\"', '"').replace(r"\'", "'")
                     .replace(r"\/", "/").replace(r"\n", "\n")
                     .replace(r"\r", "\r").replace(r"\t", "\t"))
        if next_text == decoded:
            break
        decoded = next_text
    # JavaScript may assemble a restricted string from adjacent quoted pieces:
    # "first half" + "second half".  Joining literal boundaries is a
    # conservative static check, not JavaScript evaluation.  This also catches
    # split Base64 strings before they are decoded by a browser.
    return re.sub(r"""['"`][ \t\r\n]*\+[ \t\r\n]*['"`]""", "", decoded)


def _encoded_needles(value):
    """Exact UTF-8 text and common Base64 encodings; no private text in errors."""
    raw = value.encode("utf-8")
    standard = base64.b64encode(raw).decode("ascii")
    urlsafe = base64.urlsafe_b64encode(raw).decode("ascii")
    # JavaScript atob(), Python and many web decoders accept omitted padding.
    # Checking only padded forms leaves those published strings undetected.
    return {value, standard, urlsafe, standard.rstrip("="), urlsafe.rstrip("=")}


def _canonical_private_text(value):
    """Compare private excerpts after harmless Unicode and spacing changes.

    A public copy may insert line breaks or spaces between characters, or
    replace full-width characters with their NFKC equivalents. These are
    formatting changes, not permission to publish source-only material.
    """
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", value))


def _private_segments(value):
    """Return overlapping distinctive excerpts from source-only text.

    With 64-character windows every 16 characters, every verbatim excerpt
    of at least 80 characters contains a complete checked window, including
    excerpts between the beginning, middle, and end of a long original.
    Short originals (40-80 chars) are checked in full.
    """
    if not isinstance(value, str):
        return ()
    content = value.strip()
    if len(content) < 40:
        return ()
    if len(content) <= 80:
        return (content,)
    width, step = 64, 16
    offsets = list(range(0, len(content) - width + 1, step))
    if offsets[-1] != len(content) - width:
        offsets.append(len(content) - width)
    # Keep the full original too: Base64 of a complete string is not
    # generally a substring of Base64 of an overlapping window.
    return tuple(dict.fromkeys([content] + [content[offset:offset + width] for offset in offsets]))


def validate_public_site_text(source, site_root):
    markers = []
    for case in source.get("cases", []):
        if not isinstance(case, dict):
            continue
        case_id = str(case.get("id", "unknown"))
        prompt = case.get("originalQuestion")
        for segment in _private_segments(prompt):
            markers.extend((case_id, text) for text in _encoded_needles(segment))
        for field in ("originalQuestionSha256", "originalFileSha256"):
            digest = case.get(field)
            if (isinstance(digest, str) and len(digest) == 64
                    and all(ch in "0123456789abcdefABCDEF" for ch in digest)):
                markers.extend((case_id, text) for text in _encoded_needles(digest))
    # Source inventory fingerprints must also remain outside the Pages artifact.
    for entry in source.get("inventory", []):
        if not isinstance(entry, dict):
            continue
        digest = entry.get("sha256")
        if (isinstance(digest, str) and len(digest) == 64
                and all(ch in "0123456789abcdefABCDEF" for ch in digest)):
            markers.extend((str(entry.get("id", "inventory-unknown")), text) for text in _encoded_needles(digest))
    if not markers:
        return 0
    canonical_markers = [
        (case_id, needle, _canonical_private_text(needle))
        for case_id, needle in markers
    ]
    root = Path(site_root)
    checked = 0
    for path in root.rglob("*"):
        if not path.is_file() or path.is_symlink() or path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        content = path.read_text(encoding="utf-8")
        checked += 1
        # Escaped text must not bypass the final Pages privacy check.
        decoded = _decoded_public_text(content)
        canonical = _canonical_private_text(decoded)
        for case_id, needle, normalized_needle in canonical_markers:
            if (needle in content or needle in decoded
                    or normalized_needle in canonical):
                relative = path.relative_to(root)
                raise ValueError(
                    f"Private source-only case material in public artifact {relative} (case {case_id})"
                )
    return checked
