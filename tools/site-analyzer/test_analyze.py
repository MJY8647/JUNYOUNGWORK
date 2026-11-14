"""Tests for analyze.py against small synthetic repositories (stdlib unittest).
Run: python3 -m unittest tools/site-analyzer/test_analyze.py"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import analyze  # noqa: E402


def make(files: dict) -> Path:
    root = Path(tempfile.mkdtemp())
    for rel, text in files.items():
        p = root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text)
    return root


class AnalyzerTests(unittest.TestCase):
    def test_static_single_page(self):
        root = make({
            "index.html": '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400">'
                          '<article data-page="about"></article><article data-page="blog"></article>',
            "assets/style.css": ":root{--accent: hsl(45,100%,72%);--ff-main:'Poppins';--fw-500:500;--shadow-1:0 1px 2px #000;}",
            "assets/app.js": "document.querySelector('[data-nav-link]').addEventListener('click',()=>{}); form.checkValidity();",
            "LICENSE": "MIT License",
        })
        r = analyze.analyze(root, "demo")
        self.assertTrue(r["stack"]["framework"].startswith("Static"))
        self.assertEqual(r["stack"]["license"], "MIT")
        self.assertIn("/index.html#about", [x["route"] for x in r["routes"]])
        tokens = r["tokens"]["custom_properties"]
        self.assertIn("--accent", tokens["color"])
        self.assertIn("--ff-main", tokens["font-family"])
        self.assertIn("--fw-500", tokens["font-weight"])
        self.assertIn("--shadow-1", tokens["shadow"])
        self.assertEqual(r["tokens"]["google_fonts"], ["Poppins:wght@400"])
        self.assertIn("[data-nav-link]", r["interactions"]["data_attribute_hooks"])
        self.assertIn("form validation API", r["interactions"]["browser_apis"])

    def test_astro_routes_and_components(self):
        root = make({
            "package.json": json.dumps({"dependencies": {"astro": "^7.0.0", "tailwindcss": "^4"}}),
            "astro.config.ts": "export default {}",
            "src/pages/index.astro": "", "src/pages/blog/[slug].astro": "",
            "src/pages/[...blog]/[...page].astro": "", "src/pages/rss.xml.ts": "",
            "src/components/widgets/Hero.astro": "", "src/layouts/Layout.astro": "",
        })
        r = analyze.analyze(root, "astro-demo")
        self.assertEqual(r["stack"]["framework"], "Astro")
        self.assertIn("Tailwind CSS", r["stack"]["styling"])
        routes = {x["route"]: x["kind"] for x in r["routes"]}
        self.assertEqual(routes["/"], "page")
        self.assertIn("/blog/:slug", routes)
        self.assertIn("/*blog/*page", routes)
        self.assertEqual(routes["/rss.xml"], "endpoint")
        self.assertEqual(r["components"]["widgets"], ["Hero"])
        self.assertEqual(r["components"]["layouts"], ["Layout"])

    def test_jekyll_gem_theme_note(self):
        root = make({
            "Gemfile": "gem 'jekyll'\ngem 'al_folio_core'\n",
            "_config.yml": "style_engine: tailwind\n",
            "_pages/about.md": "---\nlayout: about\npermalink: /\ntitle: about\n---\n",
            "_bibliography/papers.bib": "@article{a, title={x}}",
        })
        r = analyze.analyze(root, "jekyll-demo")
        self.assertTrue(r["stack"]["framework"].startswith("Jekyll"))
        self.assertTrue(any("al_folio_core" in n for n in r["stack"]["notes"]))
        self.assertEqual(r["routes"][0]["route"], "/")
        self.assertTrue(any("BibTeX" in s for s in r["blueprint"]))
        md = analyze.to_markdown(r)
        self.assertIn("Rebuild blueprint", md)


if __name__ == "__main__":
    unittest.main()
