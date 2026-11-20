#!/usr/bin/env python3
"""claude.ai 공유 페이지용 단일 HTML 만들기: three.js는 cdnjs, 나머지 CSS/JS는 인라인.
사용: python3 phoneparis-world/tools/build_artifact.py  →  phoneparis-world/dist/phoneparis-world.html"""
import re
from pathlib import Path
base = Path(__file__).resolve().parent.parent
html = (base / "index.html").read_text(encoding="utf-8")
html = html.replace('<script src="assets/vendor/three.min.js"></script>',
                    '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>')
html = re.sub(r'<link rel="stylesheet" href="(assets/[^"]+)">', lambda m: "<style>\n" + (base / m.group(1)).read_text(encoding="utf-8") + "\n</style>", html)
html = re.sub(r'<script src="(assets/[^"]+)"></script>', lambda m: "<script>\n" + (base / m.group(1)).read_text(encoding="utf-8") + "\n</script>", html)
head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
title = re.search(r"<title>.*?</title>", head).group(0)
head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', "", head.replace(title, ""))
out = base / "dist" / "phoneparis-world.html"
out.parent.mkdir(exist_ok=True)
out.write_text(title + '\n<meta name="claude:viewport-fit-sides" content="cover">\n' + head.strip() + "\n" + body.strip() + "\n", encoding="utf-8")
print("wrote", out)
