#!/usr/bin/env python3
"""Site Analyzer — reverse-engineer a website repository from its source.

Usage:
    python3 analyze.py <github-url | owner/repo | local-path> [-o OUT_DIR] [--keep]

Produces OUT_DIR/<name>.md (human report) and OUT_DIR/<name>.json (raw data):
framework & dependencies, language mix, directory map, routes/pages,
components, design tokens (CSS custom properties, fonts, Tailwind @theme),
client-side interactions, external resources, SEO features, content
collections, and a rebuild blueprint.

Only the Python standard library is used. Remote repositories are cloned
shallowly (git must be installed) into a temporary directory.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from collections import Counter, defaultdict
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "dist", "build", ".next", ".astro", "_site",
             "vendor/bundle", ".cache", "__pycache__", ".venv", "coverage",
             # generated reports / screenshots that would pollute token & event stats
             "lighthouse_results", "readme_preview", "playwright-report", "test-results"}
TEXT_EXT = {".html", ".htm", ".css", ".scss", ".sass", ".less", ".js", ".mjs", ".cjs",
            ".ts", ".tsx", ".jsx", ".astro", ".vue", ".svelte", ".md", ".mdx", ".liquid",
            ".yml", ".yaml", ".json", ".toml", ".py", ".rb", ".bib", ".txt", ".xml", ".svg"}
LANG_BY_EXT = {
    ".html": "HTML", ".htm": "HTML", ".liquid": "Liquid", ".css": "CSS", ".scss": "SCSS",
    ".sass": "SCSS", ".less": "Less", ".js": "JavaScript", ".mjs": "JavaScript",
    ".cjs": "JavaScript", ".jsx": "JSX", ".ts": "TypeScript", ".tsx": "TSX",
    ".astro": "Astro", ".vue": "Vue", ".svelte": "Svelte", ".md": "Markdown",
    ".mdx": "MDX", ".yml": "YAML", ".yaml": "YAML", ".json": "JSON", ".toml": "TOML",
    ".rb": "Ruby", ".py": "Python", ".bib": "BibTeX",
}
IMG_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".ico"}
COMPONENT_EXT = {".astro", ".jsx", ".tsx", ".vue", ".svelte"}
MAX_READ = 600_000  # bytes per file


# --------------------------------------------------------------------------- io
def resolve_source(target: str, workdir: Path) -> tuple[Path, str]:
    """Return (local path, display name). Clones remote repos shallowly."""
    p = Path(target).expanduser()
    if p.exists():
        return p.resolve(), p.resolve().name
    m = re.match(r"^(?:https?://github\.com/)?([\w.-]+)/([\w.-]+?)(?:\.git)?/?$", target)
    if not m:
        sys.exit(f"error: '{target}' is neither a local path nor a GitHub repo")
    owner, repo = m.groups()
    dest = workdir / repo
    url = f"https://github.com/{owner}/{repo}.git"
    print(f"cloning {url} ...", file=sys.stderr)
    subprocess.run(["git", "clone", "-q", "--depth", "1", url, str(dest)], check=True)
    return dest, f"{owner}/{repo}"


def walk(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        rel_dir = Path(dirpath).relative_to(root)
        dirnames[:] = [d for d in dirnames
                       if d not in SKIP_DIRS and str(rel_dir / d) not in SKIP_DIRS]
        for f in filenames:
            yield Path(dirpath) / f


def read(path: Path) -> str:
    try:
        with open(path, "rb") as fh:
            return fh.read(MAX_READ).decode("utf-8", "replace")
    except OSError:
        return ""


def front_matter(text: str) -> dict[str, str]:
    """Very small YAML front-matter reader (top-level `key: value` only)."""
    m = re.match(r"^---\s*\n(.*?)\n---", text, re.S)
    out: dict[str, str] = {}
    if m:
        for line in m.group(1).splitlines():
            km = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", line)
            if km:
                out[km.group(1)] = km.group(2).strip().strip("'\"")
    return out


# ---------------------------------------------------------------- analyzers
def detect_stack(root: Path, files: list[Path]) -> dict:
    names = {f.relative_to(root).as_posix() for f in files}
    pkg = {}
    if (root / "package.json").exists():
        try:
            pkg = json.loads(read(root / "package.json"))
        except json.JSONDecodeError:
            pkg = {}
    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    gems = re.findall(r"^\s*gem\s+['\"]([\w-]+)['\"]", read(root / "Gemfile"), re.M) \
        if (root / "Gemfile").exists() else []

    def has(prefix: str) -> bool:
        return any(n == prefix or n.startswith(prefix) for n in names)

    framework, generator = "Static HTML/CSS/JS", "none (no build step)"
    if any(n.startswith("astro.config") for n in names) or "astro" in deps:
        framework, generator = "Astro", f"astro {deps.get('astro', '')}".strip()
    elif any(n.startswith("next.config") for n in names) or "next" in deps:
        framework, generator = "Next.js (React)", f"next {deps.get('next', '')}".strip()
    elif "gatsby" in deps:
        framework, generator = "Gatsby (React)", "gatsby"
    elif "nuxt" in deps:
        framework, generator = "Nuxt (Vue)", "nuxt"
    elif "@sveltejs/kit" in deps:
        framework, generator = "SvelteKit", "svelte-kit"
    elif "jekyll" in gems or has("_config.yml") and (has("_posts") or has("_pages")):
        framework, generator = "Jekyll (Ruby, Liquid templates)", "jekyll"
    elif has("hugo.toml") or has("hugo.yaml") or has("config.toml") and has("layouts/"):
        framework, generator = "Hugo (Go templates)", "hugo"
    elif "react" in deps:
        framework, generator = "React SPA", "vite" if "vite" in deps else "react-scripts" if "react-scripts" in deps else "?"

    styling = []
    if "tailwindcss" in deps or "@tailwindcss/vite" in deps or any("tailwind" in n for n in names):
        styling.append("Tailwind CSS")
    if any(n.endswith((".scss", ".sass")) for n in names):
        styling.append("Sass/SCSS")
    if "styled-components" in deps:
        styling.append("styled-components")
    config_yml = read(root / "_config.yml") if (root / "_config.yml").exists() else ""
    if re.search(r"style_engine:\s*tailwind", config_yml) and "Tailwind CSS" not in styling:
        styling.append("Tailwind CSS (via _config.yml style_engine)")
    if "bootstrap" in deps or "bootstrap" in gems:
        styling.append("Bootstrap")
    if not styling:
        styling.append("Hand-written CSS")

    hosting = [h for f, h in [("vercel.json", "Vercel"), ("netlify.toml", "Netlify"),
                              ("wrangler.jsonc", "Cloudflare"), ("wrangler.toml", "Cloudflare"),
                              ("Dockerfile", "Docker"), ("CNAME", "GitHub Pages (custom domain)")]
               if f in names]
    if any(n.startswith(".github/workflows/") and "deploy" in read(root / n).lower() for n in names
           if n.endswith((".yml", ".yaml"))):
        hosting.append("GitHub Actions deploy workflow")

    license_name = "unknown"
    for cand in ("LICENSE", "LICENSE.md", "LICENSE.txt", "license"):
        if (root / cand).exists():
            head = read(root / cand)[:400]
            for lic in ("MIT", "Apache", "GPL", "BSD", "ISC", "MPL", "Unlicense", "CC"):
                if lic.lower() in head.lower():
                    license_name = lic
                    break
            break

    notes = []
    if framework.startswith("Jekyll") and not has("_layouts/"):
        theme_gems = [g for g in gems if re.search(r"theme|core|al_folio", g)]
        notes.append("No _layouts/ in repo: templates ship inside gem(s) "
                     + (", ".join(theme_gems[:4]) if theme_gems else "(remote theme)")
                     + " — inspect the gem source for markup.")
    return {
        "framework": framework, "generator": generator, "styling": styling, "notes": notes,
        "npm_dependencies": dict(sorted(deps.items())), "npm_scripts": pkg.get("scripts", {}),
        "ruby_gems": gems, "hosting_hints": hosting, "license": license_name,
    }


def language_mix(root: Path, files: list[Path]) -> dict:
    lines: Counter = Counter()
    count: Counter = Counter()
    images = 0
    for f in files:
        ext = f.suffix.lower()
        if ext in IMG_EXT and ext != ".svg":
            images += 1
        lang = LANG_BY_EXT.get(ext)
        if lang:
            count[lang] += 1
            lines[lang] += read(f).count("\n")
    return {"files": dict(count.most_common()), "lines": dict(lines.most_common()),
            "raster_images": images}


def directory_map(root: Path, files: list[Path]) -> dict:
    tops: Counter = Counter()
    seconds: dict[str, Counter] = defaultdict(Counter)
    for f in files:
        parts = f.relative_to(root).parts
        if len(parts) == 1:
            tops["(root files)"] += 1
        else:
            tops[parts[0] + "/"] += 1
            if len(parts) > 2:
                seconds[parts[0]][parts[1] + "/"] += 1
    return {"top": dict(tops.most_common()),
            "second": {k: dict(v.most_common(12)) for k, v in seconds.items()}}


def routes(root: Path, files: list[Path], framework: str) -> list[dict]:
    out = []
    for f in files:
        rel = f.relative_to(root).as_posix()
        # Astro / Next pages router / SvelteKit-ish file based routing
        m = re.match(r"^(?:src/)?pages/(.+)\.(astro|md|mdx|jsx|tsx|js|ts|html)$", rel)
        if m and "Astro" in framework or m and "Next" in framework:
            route = "/" + re.sub(r"(^|/)index$", "", m.group(1))
            route = re.sub(r"\[\.\.\.(\w+)\]", r"*\1", route)
            route = re.sub(r"\[(\w+)\]", r":\1", route)
            out.append({"route": route or "/", "source": rel,
                        "kind": "endpoint" if m.group(2) in ("ts", "js") and "rss" in rel or rel.endswith(".xml.ts") else "page"})
            continue
        m = re.match(r"^(?:src/)?app/(.*)page\.(jsx|tsx|js|ts|mdx)$", rel)
        if m and "Next" in framework:
            out.append({"route": "/" + m.group(1).rstrip("/"), "source": rel, "kind": "page"})
            continue
        if "Jekyll" in framework and rel.startswith("_pages/"):
            fm = front_matter(read(f))
            out.append({"route": fm.get("permalink", "/" + f.stem + "/"), "source": rel,
                        "kind": f"page (layout: {fm.get('layout', '?')})", "title": fm.get("title", "")})
            continue
        if framework.startswith("Static") and f.suffix in (".html", ".htm"):
            out.append({"route": "/" + rel, "source": rel, "kind": "html file"})
            # single-page "virtual pages" toggled by JS
            for vp in re.findall(r'data-page="([^"]+)"', read(f)):
                out.append({"route": f"/{rel}#{vp}", "source": rel, "kind": "SPA section (data-page)"})
    return sorted(out, key=lambda r: r["route"])


def components(root: Path, files: list[Path]) -> dict:
    groups: dict[str, list[str]] = defaultdict(list)
    for f in files:
        rel = f.relative_to(root).as_posix()
        if f.suffix in COMPONENT_EXT and "/components/" in "/" + rel:
            group = rel.split("components/", 1)[1].rsplit("/", 1)
            groups[group[0] if len(group) == 2 else "(root)"].append(f.stem)
        elif f.suffix in COMPONENT_EXT and "/layouts/" in "/" + rel:
            groups["layouts"].append(f.stem)
        elif rel.startswith(("_includes/", "_layouts/")):
            groups[rel.split("/")[0]].append(f.stem)
    return {k: sorted(v) for k, v in sorted(groups.items())}


CSS_VAR = re.compile(r"(--[\w-]+)\s*:\s*([^;{}]+);")


def classify_token(name: str, value: str) -> str:
    n, v = name.lower(), value.lower()
    if re.match(r"^--fw-", n):
        return "font-weight"
    if re.search(r"font|ff-", n):
        if re.search(r"fw|weight", n):
            return "font-weight"
        if re.search(r"fs-|size", n):
            return "font-size"
        return "font-family"
    if "shadow" in n:
        return "shadow"
    if re.search(r"radius|rounded", n):
        return "radius"
    if re.search(r"transition|duration|ease", n):
        return "motion"
    if re.search(r"gradient", n) or "gradient(" in v:
        return "gradient"
    if re.search(r"#[0-9a-f]{3,8}\b|rgb|hsl|oklch|color\(", v) or re.search(r"color|bg|text", n):
        return "color"
    if re.search(r"space|gap|pad|margin|width|height|size", n) or re.match(r"^[\d.]+(px|rem|em|%)$", v.strip()):
        return "spacing/size"
    return "other"


def design_tokens(root: Path, files: list[Path]) -> dict:
    tokens: dict[str, dict] = {}
    google_fonts, font_faces, theme_blocks = set(), set(), []
    dark_mode = []
    for f in files:
        if f.suffix not in {".css", ".scss", ".astro", ".html", ".vue", ".svelte", ".liquid"}:
            continue
        text = read(f)
        rel = f.relative_to(root).as_posix()
        for name, value in CSS_VAR.findall(text):
            value = " ".join(value.split())
            if name.startswith("--tw-") or len(value) > 160:
                continue
            tokens.setdefault(name, {"value": value, "group": classify_token(name, value), "file": rel})
        google_fonts.update(re.findall(r"fonts\.googleapis\.com/css2?\?family=([^\"'&]+)", text))
        font_faces.update(re.findall(r"font-family:\s*['\"]?([A-Z][\w ]+)['\"]?", text))
        if "@theme" in text:
            theme_blocks.append(rel)
        if re.search(r"prefers-color-scheme:\s*dark|\.dark\b|\[data-theme=['\"]?dark", text):
            dark_mode.append(rel)
    grouped: dict[str, dict[str, str]] = defaultdict(dict)
    for name, t in tokens.items():
        grouped[t["group"]][name] = t["value"]
    return {"custom_properties": {k: dict(v) for k, v in sorted(grouped.items())},
            "google_fonts": sorted(g.replace("+", " ") for g in google_fonts),
            "font_families_in_css": sorted(font_faces)[:20],
            "tailwind_theme_files": theme_blocks, "dark_mode_files": sorted(set(dark_mode))}


def interactions(root: Path, files: list[Path]) -> dict:
    events: Counter = Counter()
    hooks: Counter = Counter()
    apis: Counter = Counter()
    api_patterns = {
        "localStorage": r"localStorage", "IntersectionObserver": r"IntersectionObserver",
        "fetch()": r"\bfetch\(", "matchMedia (theme/breakpoints)": r"matchMedia\(",
        "history/View Transitions": r"history\.pushState|startViewTransition|ClientRouter|ViewTransitions",
        "form validation API": r"checkValidity\(", "scroll handling": r"scrollTo|addEventListener\(['\"]scroll",
        "clipboard": r"navigator\.clipboard", "web components": r"customElements\.define",
    }
    for f in files:
        if f.suffix not in {".js", ".mjs", ".ts", ".astro", ".html", ".jsx", ".tsx", ".vue", ".svelte", ".liquid"}:
            continue
        text = read(f)
        events.update(re.findall(r"addEventListener\(\s*['\"]([\w:-]+)['\"]", text))
        events.update(e.lower() for e in re.findall(r"\bon(Click|Change|Submit|Input|KeyDown|Scroll)\b", text))
        hooks.update(re.findall(r"querySelector(?:All)?\(\s*['\"](\[data-[\w-]+[^'\"]*\])['\"]", text))
        for label, pat in api_patterns.items():
            if re.search(pat, text):
                apis[label] += 1
    return {"dom_events": dict(events.most_common(20)), "data_attribute_hooks": dict(hooks.most_common(30)),
            "browser_apis": dict(apis.most_common())}


def external_resources(root: Path, files: list[Path]) -> dict:
    scripts, styles = Counter(), Counter()
    for f in files:
        if f.suffix not in {".html", ".astro", ".liquid", ".jsx", ".tsx", ".yml", ".yaml"}:
            continue
        text = read(f)
        for url in re.findall(r"<script[^>]+src=[\"'](https?://[^\"']+)", text):
            scripts[re.sub(r"^https?://([^/]+).*", r"\1", url)] += 1
        for url in re.findall(r"<link[^>]+href=[\"'](https?://[^\"']+)", text):
            styles[re.sub(r"^https?://([^/]+).*", r"\1", url)] += 1
    return {"script_hosts": dict(scripts.most_common()), "link_hosts": dict(styles.most_common())}


def seo(root: Path, files: list[Path], deps: dict) -> dict:
    found = Counter()
    for f in files:
        if f.suffix not in {".html", ".astro", ".liquid", ".ts", ".tsx", ".jsx"}:
            continue
        text = read(f)
        for label, pat in {"meta description": r'name=["\']description', "Open Graph": r'og:|openGraph|OpenGraph',
                           "Twitter card": r'twitter:card|twitter:', "canonical URL": r'rel=["\']canonical|canonical',
                           "JSON-LD structured data": r'application/ld\+json|StructuredData',
                           "manifest/PWA": r'rel=["\']manifest'}.items():
            if re.search(pat, text):
                found[label] += 1
    names = {f.name for f in files}
    extras = []
    if "@astrojs/sitemap" in deps or "sitemap.xml" in names or "next-sitemap" in deps:
        extras.append("sitemap")
    if "@astrojs/rss" in deps or any("rss" in n or "feed" in n for n in names):
        extras.append("RSS/Atom feed")
    if "robots.txt" in names:
        extras.append("robots.txt")
    return {"in_templates": dict(found), "generated": extras}


def content(root: Path, files: list[Path]) -> dict:
    groups: Counter = Counter()
    data_files = []
    for f in files:
        rel = f.relative_to(root).as_posix()
        if f.suffix in (".md", ".mdx") and not re.match(r"^(README|CHANGELOG|CONTRIBUTING|CODE_OF_CONDUCT|AGENTS|CLAUDE|LICENSE)", f.name, re.I) \
                and not rel.startswith(("docs/", ".github/", ".agents/")):
            groups[str(Path(rel).parent)] += 1
        if f.suffix in (".yml", ".yaml", ".json", ".bib", ".toml") and re.match(r"^(_data|src/data|data|_bibliography|src/config)", rel) \
                or rel in ("src/config.yaml", "_config.yml"):
            data_files.append(rel)
    return {"markdown_collections": dict(groups.most_common(15)), "data_files": sorted(data_files)[:30]}


# ------------------------------------------------------------------- report
def blueprint(r: dict) -> list[str]:
    steps = []
    st = r["stack"]
    if st["framework"].startswith("Static"):
        steps.append("Single HTML document; replicate as-is with semantic sections and one CSS + one JS file.")
    else:
        steps.append(f"Source uses {st['framework']}; a dependency-free rebuild maps each route to a static HTML page "
                     "and each component to a reusable HTML/CSS pattern (or a JS render function fed by JSON data).")
    if r["tokens"]["custom_properties"]:
        n = sum(len(v) for v in r["tokens"]["custom_properties"].values())
        steps.append(f"Recreate the design system first: {n} CSS custom properties → one `tokens.css` (:root).")
    if r["tokens"]["dark_mode_files"]:
        steps.append("Dark mode exists: implement `prefers-color-scheme` + a persisted toggle (localStorage) on <html>.")
    if r["interactions"]["data_attribute_hooks"]:
        steps.append("Interactions are bound through data-* hooks: "
                     + ", ".join(list(r["interactions"]["data_attribute_hooks"])[:8]) + " → keep the same hook pattern.")
    if r["content"]["markdown_collections"]:
        steps.append("Content lives in Markdown collections → export to a JSON array and render lists/detail views in JS.")
    if any(f.endswith(".bib") for f in r["content"]["data_files"]):
        steps.append("Publications come from BibTeX → write a small BibTeX parser that renders grouped-by-year entries.")
    steps.append("Verify with headless browser screenshots at desktop (1440px) and phone (390px) widths.")
    return steps


def to_markdown(r: dict) -> str:
    L = []
    st = r["stack"]
    L += [f"# Site analysis — {r['name']}", "",
          f"- **Framework:** {st['framework']}  ", f"- **Generator/build:** {st['generator']}  ",
          f"- **Styling:** {', '.join(st['styling'])}  ", f"- **License:** {st['license']}  ",
          f"- **Hosting hints:** {', '.join(st['hosting_hints']) or '—'}  ",
          f"- **Last commit:** {r.get('last_commit', '—')}", ""]
    L += [f"> ⚠️ {n}" for n in st.get("notes", [])] + ([""] if st.get("notes") else [])
    L += ["## Language mix", "", "| Language | Files | Lines |", "|---|---:|---:|"]
    for lang, n in r["languages"]["files"].items():
        L.append(f"| {lang} | {n} | {r['languages']['lines'].get(lang, 0)} |")
    L += [f"", f"Raster images: {r['languages']['raster_images']}", ""]
    L += ["## Directory map", "", "```"]
    for d, n in r["dirs"]["top"].items():
        L.append(f"{d:<32}{n:>5} files")
        for sd, sn in r["dirs"]["second"].get(d.rstrip("/"), {}).items():
            L.append(f"  └ {sd:<28}{sn:>5}")
    L += ["```", ""]
    if st["npm_dependencies"] or st["ruby_gems"]:
        L += ["## Dependencies", ""]
        if st["npm_dependencies"]:
            L.append("**npm:** " + ", ".join(f"`{k}@{v}`" for k, v in st["npm_dependencies"].items()))
        if st["ruby_gems"]:
            L.append("")
            L.append("**gems:** " + ", ".join(f"`{g}`" for g in st["ruby_gems"]))
        L.append("")
    L += ["## Routes / pages", "", "| Route | Kind | Source |", "|---|---|---|"]
    for rt in r["routes"][:80]:
        L.append(f"| `{rt['route']}` | {rt['kind']} | `{rt['source']}` |")
    if not r["routes"]:
        L.append("| — | — | — |")
    L.append("")
    if r["components"]:
        L += ["## Components", ""]
        for g, items in r["components"].items():
            L.append(f"- **{g}** ({len(items)}): " + ", ".join(items))
        L.append("")
    tk = r["tokens"]
    L += ["## Design tokens", ""]
    for group, items in tk["custom_properties"].items():
        L += [f"**{group}** ({len(items)})", "", "| Token | Value |", "|---|---|"]
        for k, v in list(items.items())[:40]:
            safe = v.replace("|", "\\|")
            L.append(f"| `{k}` | `{safe}` |")
        L.append("")
    L.append(f"- Google Fonts: {', '.join(tk['google_fonts']) or '—'}")
    L.append(f"- Tailwind `@theme` files: {', '.join(tk['tailwind_theme_files']) or '—'}")
    L.append(f"- Dark-mode rules in: {', '.join(tk['dark_mode_files'][:8]) or '—'}")
    L.append("")
    ix = r["interactions"]
    L += ["## Client-side behaviour", "",
          "- DOM events: " + (", ".join(f"`{k}`×{v}" for k, v in ix["dom_events"].items()) or "—"),
          "- data-* hooks: " + (", ".join(f"`{k}`" for k in ix["data_attribute_hooks"]) or "—"),
          "- Browser APIs: " + (", ".join(f"{k} ({v} files)" for k, v in ix["browser_apis"].items()) or "—"), ""]
    ex = r["external"]
    L += ["## External resources", "",
          "- Script hosts: " + (", ".join(f"{k}×{v}" for k, v in ex["script_hosts"].items()) or "—"),
          "- Stylesheet/link hosts: " + (", ".join(f"{k}×{v}" for k, v in ex["link_hosts"].items()) or "—"), ""]
    L += ["## SEO", "",
          "- In templates: " + (", ".join(r["seo"]["in_templates"]) or "—"),
          "- Generated: " + (", ".join(r["seo"]["generated"]) or "—"), ""]
    ct = r["content"]
    L += ["## Content & data", ""]
    for d, n in ct["markdown_collections"].items():
        L.append(f"- `{d}/` — {n} Markdown file(s)")
    for d in ct["data_files"]:
        L.append(f"- data: `{d}`")
    L += ["", "## Rebuild blueprint", ""]
    L += [f"{i}. {s}" for i, s in enumerate(r["blueprint"], 1)]
    L.append("")
    return "\n".join(L)


def analyze(root: Path, name: str) -> dict:
    files = [f for f in walk(root) if f.is_file()]
    stack = detect_stack(root, files)
    result = {
        "name": name, "file_count": len(files), "stack": stack,
        "languages": language_mix(root, files), "dirs": directory_map(root, files),
        "routes": routes(root, files, stack["framework"]), "components": components(root, files),
        "tokens": design_tokens(root, files), "interactions": interactions(root, files),
        "external": external_resources(root, files), "seo": seo(root, files, stack["npm_dependencies"]),
        "content": content(root, files),
    }
    try:
        result["last_commit"] = subprocess.run(["git", "-C", str(root), "log", "-1", "--format=%h %cs"],
                                               capture_output=True, text=True, check=True).stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    result["blueprint"] = blueprint(result)
    return result


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("target", help="GitHub URL, owner/repo, or local directory")
    ap.add_argument("-o", "--out", default="reports", help="output directory (default: reports)")
    ap.add_argument("--keep", action="store_true", help="keep the temporary clone")
    a = ap.parse_args()
    work = Path(tempfile.mkdtemp(prefix="site-analyzer-"))
    try:
        root, name = resolve_source(a.target, work)
        result = analyze(root, name)
        out = Path(a.out)
        out.mkdir(parents=True, exist_ok=True)
        slug = name.replace("/", "__")
        (out / f"{slug}.json").write_text(json.dumps(result, indent=2, ensure_ascii=False))
        (out / f"{slug}.md").write_text(to_markdown(result))
        print(f"wrote {out / (slug + '.md')} and {slug}.json")
    finally:
        if a.keep:
            print(f"clone kept at {work}", file=sys.stderr)
        else:
            shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
