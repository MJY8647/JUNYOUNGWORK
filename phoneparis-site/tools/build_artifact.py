#!/usr/bin/env python3
"""단일 파일 미리보기(downloads/phoneparis-preview.html)를 claude.ai 공유 페이지용으로 변환.
게시 시 문서 뼈대가 자동으로 붙으므로 doctype/html/head/body 태그를 뺍니다.
사용: python3 phoneparis-site/tools/build_artifact.py <preview.html> <out.html>"""
import re, sys
src, dst = sys.argv[1], sys.argv[2]
h = open(src, encoding="utf-8").read()
head = re.search(r"<head>(.*?)</head>", h, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", h, re.S).group(1)
title = re.search(r"<title>.*?</title>", head).group(0)
head = head.replace(title, "")
head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', "", head)
out = title + '\n<meta name="claude:viewport-fit-sides" content="cover">\n' + head.strip() + "\n" + body.strip() + "\n"
open(dst, "w", encoding="utf-8").write(out)
print("wrote", dst, len(out) // 1024, "KB")
