#!/usr/bin/env python3
"""Static recon of a live website: stack hints, fonts, design tokens, scripts, meta.

Usage: python3 recon.py https://example.com [--out DIR]

Fetches the HTML and same-origin stylesheets/scripts (via curl, so it honours HTTPS_PROXY),
then writes recon.json + recon.md to DIR (default: ./recon-<host>). Stdlib only.
It only reads what any browser downloads; it does not crawl beyond the first page's assets.
"""
import json, re, subprocess, sys, urllib.parse as up
from collections import Counter
from pathlib import Path

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"

SIGNS = {
    "Astro": [r"/_astro/", r"astro-island", r'name="generator" content="Astro'],
    "Next.js": [r"__NEXT_DATA__", r"/_next/static/"],
    "Nuxt": [r"__NUXT__", r"/_nuxt/"],
    "SvelteKit": [r"__sveltekit", r"/_app/immutable/"],
    "Gatsby": [r"___gatsby"],
    "Webflow": [r"data-wf-page", r"webflow\.js", r"assets\.website-files\.com"],
    "Framer": [r"framerusercontent\.com", r"data-framer-"],
    "WordPress": [r"wp-content/", r"wp-includes/"],
    "Shopify": [r"cdn\.shopify\.com"],
    "React": [r"react-dom", r"data-reactroot"],
    "Vue": [r"data-v-[0-9a-f]{6,}", r"vue(\.runtime)?(\.min)?\.js"],
    "Tailwind": [r"--tw-", r"tailwind"],
    "Three.js": [r"three(\.module)?(\.min)?\.js", r"WebGLRenderer", r"THREE\.", r"\.glb\b", r"DRACOLoader", r"KTX2Loader"],
    "Spline": [r"spline\.design", r"@splinetool"],
    "GSAP": [r"gsap", r"ScrollTrigger", r"ScrambleTextPlugin", r"\bFlip\b"],
    "Lenis": [r"lenis"],
    "Locomotive Scroll": [r"locomotive-scroll"],
    "Barba.js": [r"barba"],
    "Lottie": [r"lottie"],
    "Framer Motion": [r"framer-motion"],
    "Google Tag Manager": [r"googletagmanager\.com"],
    "reCAPTCHA": [r"recaptcha"],
}


def fetch(url, limit=4_000_000):
    try:
        out = subprocess.run(["curl", "-sSL", "--max-time", "25", "-A", UA, url],
                             capture_output=True, timeout=40)
        return out.stdout[:limit].decode("utf-8", "replace") if out.returncode == 0 else ""
    except Exception:
        return ""


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    url = sys.argv[1]
    host = up.urlparse(url).hostname or "site"
    out = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else Path(f"recon-{host}")
    out.mkdir(parents=True, exist_ok=True)

    html = fetch(url)
    if not html:
        sys.exit(f"Could not fetch {url} (network policy or site down). Check the proxy/allowlist.")

    css_urls = [up.urljoin(url, h) for h in re.findall(r'<link[^>]+rel=["\']?stylesheet[^>]*href=["\']([^"\']+)', html, re.I)]
    css_urls += [up.urljoin(url, h) for h in re.findall(r'<link[^>]+href=["\']([^"\']+\.css[^"\']*)', html, re.I)]
    js_urls = [up.urljoin(url, s) for s in re.findall(r'<script[^>]+src=["\']([^"\']+)', html, re.I)]
    js_urls += [up.urljoin(url, s) for s in re.findall(r'<link[^>]+rel=["\']?modulepreload[^>]*href=["\']([^"\']+)', html, re.I)]
    css_urls, js_urls = list(dict.fromkeys(css_urls)), list(dict.fromkeys(js_urls))

    same = lambda u: up.urlparse(u).hostname == host
    css = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", html, re.S | re.I))
    for u in css_urls[:12]:
        if same(u) or "fonts.googleapis" not in u:
            css += "\n" + fetch(u)
    seen, js = set(), ""
    queue = [u for u in js_urls if same(u)]
    # follow static/dynamic imports one level deep: bundlers split libraries (GSAP, three) into chunks
    for depth in range(3):
        nxt = []
        for u in queue[:60]:
            if u in seen: continue
            seen.add(u); code = fetch(u, 1_500_000); js += "\n" + code
            # quoted chunk paths: import/from specifiers and bundler preload maps (e.g. "_astro/x.js")
            nxt += [up.urljoin(u, m) if m.startswith(".") else up.urljoin(url, "/" + m.lstrip("/"))
                    for m in re.findall(r'["\']((?:\.{1,2}/|/)?[\w@./-]+\.m?js)["\']', code)
                    if m.startswith((".", "/")) or "/" in m]
        queue = [u for u in dict.fromkeys(nxt) if same(u) and u not in seen]
    blob = "\n".join([html, css, js])

    stack = {k: [p for p in pats if re.search(p, blob, re.I)] for k, pats in SIGNS.items()}
    stack = {k: v for k, v in stack.items() if v}

    fonts = {f.strip() for f in re.findall(r"font-family\s*:\s*['\"]?([^;'\",}]+)", css) if not f.strip().startswith("var(")}
    fonts |= set(f.replace("+", " ") for f in re.findall(r"family=([A-Za-z+]+)", html))
    font_files = sorted(set(re.findall(r"url\(['\"]?([^)'\"]+\.(?:woff2?|ttf|otf))", css)))[:20]

    tokens = {}
    for name, val in re.findall(r"(--[\w-]+)\s*:\s*([^;}{]+)", css):
        tokens.setdefault(name.strip(), val.strip())
    def kind(n, v):
        if re.search(r"#[0-9a-f]{3,8}\b|rgb|hsl|oklch|color", v + n, re.I): return "color"
        if re.search(r"font|type|text|leading|track|letter", n, re.I): return "type"
        if re.search(r"ease|duration|cubic-bezier|\bms\b|\ds\b", n + v, re.I): return "motion"
        if re.search(r"radius|round", n, re.I): return "radius"
        if re.search(r"space|gap|gutter|pad|margin|size", n, re.I): return "space"
        return "other"
    grouped = {}
    for n, v in tokens.items():
        if n.startswith("--tw-"): continue
        grouped.setdefault(kind(n, v), {})[n] = v

    colors = Counter(c.lower() for c in re.findall(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b", css)).most_common(16)
    eases = Counter(re.findall(r"cubic-bezier\([^)]+\)", css)).most_common(8)
    media = Counter(re.findall(r"@media[^{]+", css)).most_common(10)
    meta = dict(re.findall(r'<meta[^>]+(?:name|property)=["\']([^"\']+)["\'][^>]+content=["\']([^"\']*)', html, re.I))
    title = (re.search(r"<title[^>]*>(.*?)</title>", html, re.S | re.I) or [None, ""])[1].strip()
    headings = [re.sub(r"<[^>]+>", " ", h).strip() for h in re.findall(r"<h[1-3][^>]*>(.*?)</h[1-3]>", html, re.S | re.I)][:30]
    sections = re.findall(r"<(section|header|footer|nav|main)[^>]*?(?:id|class)=[\"']([^\"']+)", html, re.I)[:40]
    assets = sorted(set(re.findall(r"[\w/.-]+\.(?:glb|gltf|ktx2|basis|mp4|webm|hdr|exr|riv|lottie|json)\b", blob)))[:40]
    license_hint = "open-source license text found" if re.search(r"MIT License|Apache License|GPL", html) else "assume proprietary"

    report = dict(url=url, title=title, license=license_hint, stack=stack, fonts=sorted(fonts)[:20], font_files=font_files,
                  tokens=grouped, top_colors=colors, easings=eases, media_queries=media, meta=meta,
                  headings=headings, sections=sections, media_assets=assets,
                  stylesheets=css_urls, scripts=js_urls)
    (out / "recon.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))

    md = [f"# Recon — {host}", "", f"URL: {url}  ", f"Title: {title}  ", f"License: {license_hint}", "", "## Stack"]
    md += [f"- **{k}** ({', '.join(v[:3])})" for k, v in stack.items()] or ["- nothing recognisable (likely custom)"]
    md += ["", "## Fonts"] + [f"- {f}" for f in sorted(fonts)[:20]]
    md += ["", "## Design tokens (CSS custom properties)"]
    for k, d in grouped.items():
        md += [f"### {k} ({len(d)})"] + [f"- `{n}: {v}`" for n, v in list(d.items())[:30]]
    md += ["", "## Most used colors"] + [f"- `{c}` ×{n}" for c, n in colors]
    md += ["", "## Easing curves"] + [f"- `{e}` ×{n}" for e, n in eases]
    md += ["", "## Breakpoints"] + [f"- `{m.strip()}` ×{n}" for m, n in media]
    md += ["", "## Headings (outline)"] + [f"- {h}" for h in headings if h]
    md += ["", "## Landmarks"] + [f"- `<{t}>` {c}" for t, c in sections]
    md += ["", "## Heavy media referenced"] + [f"- {a}" for a in assets]
    md += ["", "Static fetch only — render with capture.js to see client-rendered content and motion."]
    (out / "recon.md").write_text("\n".join(md))
    print(f"wrote {out/'recon.md'} and {out/'recon.json'}")
    print("stack:", ", ".join(stack) or "unknown")


if __name__ == "__main__":
    main()
