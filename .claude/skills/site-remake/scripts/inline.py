#!/usr/bin/env python3
"""Inline local CSS and JS into one HTML file so it opens with a double-click (no server).

Usage: python3 inline.py site/index.html out/preview.html

Replaces <link rel="stylesheet" href="local.css"> and <script src="local.js"></script> with their
contents. Remote URLs (fonts, CDNs) are left as they are. Images/videos referenced by relative path
are not embedded: keep them next to the output or use absolute URLs.
"""
import re, sys
from pathlib import Path


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    base = src.parent
    html = src.read_text(encoding="utf-8")
    remote = lambda u: re.match(r"^(https?:)?//", u)

    def css(m):
        href = m.group(1)
        if remote(href): return m.group(0)
        return "<style>\n" + (base / href).read_text(encoding="utf-8") + "\n</style>"

    def js(m):
        attrs, srcp = m.group(1) + m.group(3), m.group(2)
        if remote(srcp): return m.group(0)
        if "module" in attrs:
            print(f"warning: {srcp} is an ES module; it won't load from file:// — bundle it to an IIFE first")
        code = (base / srcp).read_text(encoding="utf-8").replace("</script", "<\\/script")
        return "<script>\n" + code + "\n</script>"

    html = re.sub(r'<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\'][^>]*>', css, html)
    html = re.sub(r'<script([^>]*)\ssrc=["\']([^"\']+)["\']([^>]*)>\s*</script>', js, html)
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(html, encoding="utf-8")
    left = re.findall(r'(?:src|href)=["\'](?!https?:|//|#|mailto:|data:)([^"\']+\.(?:css|js))', html)
    print(f"wrote {dst} ({dst.stat().st_size // 1024} KB)" + (f"; still external: {left}" if left else ""))


if __name__ == "__main__":
    main()
