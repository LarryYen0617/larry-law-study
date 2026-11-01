"""One exact, de-identified page authorized by the 2026-11-01 user request.

This is not a blanket permission for teacher imports, new files or search text.
Any change to the approved page requires a new reviewed digest.
"""
import hashlib
from pathlib import Path

FAMILY_PAGE = "class-notes/family-midterm-1151.html"
FAMILY_PAGE_SHA256 = "ef527c7f61f739a3791baac40667ee4184a2cbb2e0613c588fa5c762da286ec9"


def authorized_family_page(path, site_root):
    path, root = Path(path), Path(site_root)
    if path.is_symlink() or path.relative_to(root).as_posix() != FAMILY_PAGE:
        return False
    # Git's Windows checkout may use CRLF; no textual changes are exempted.
    if hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest() != FAMILY_PAGE_SHA256:
        raise ValueError("Authorized family page changed; review the exact public release again")
    return True
