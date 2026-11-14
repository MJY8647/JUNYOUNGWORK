# Site analysis — alshedivat/al-folio

- **Framework:** Jekyll (Ruby, Liquid templates)  
- **Generator/build:** jekyll  
- **Styling:** Tailwind CSS (via _config.yml style_engine)  
- **License:** MIT  
- **Hosting hints:** Docker, GitHub Actions deploy workflow  
- **Last commit:** 8158dd0 2026-11-09

> ⚠️ No _layouts/ in repo: templates ship inside gem(s) al_folio_core, al_folio_cv, al_folio_distill, al_folio_upgrade — inspect the gem source for markup.

## Language mix

| Language | Files | Lines |
|---|---:|---:|
| Markdown | 91 | 10896 |
| YAML | 42 | 7404 |
| JavaScript | 8 | 899 |
| JSON | 6 | 595 |
| HTML | 2 | 33 |
| BibTeX | 2 | 122 |
| Python | 2 | 444 |

Raster images: 19

## Directory map

```
.github/                           39 files
  └ workflows/                     23
  └ instructions/                   5
  └ ISSUE_TEMPLATE/                 4
  └ agents/                         2
assets/                            35 files
  └ img/                           21
  └ rendercv/                       4
  └ json/                           2
  └ video/                          2
  └ html/                           1
  └ audio/                          1
  └ bibliography/                   1
  └ plotly/                         1
  └ jupyter/                        1
  └ pdf/                            1
_posts/                            33 files
(root files)                       24 files
_pages/                            14 files
docs/                              14 files
  └ releases/                       2
test/                              13 files
  └ visual/                         5
_projects/                          9 files
bin/                                8 files
_data/                              7 files
_news/                              3 files
.devcontainer/                      2 files
_teachings/                         2 files
.agents/                            2 files
  └ skills/                         2
.gemini/                            1 files
_books/                             1 files
_bibliography/                      1 files
```

## Dependencies

**npm:** `@playwright/test@^1.56.1`, `@shopify/prettier-plugin-liquid@^1.11.1`, `pixelmatch@^7.1.0`, `pngjs@^7.0.0`, `prettier@^3.9.9`

**gems:** `jekyll`, `jekyll-3rd-party-libraries`, `jekyll-archives-v2`, `jekyll-cache-bust`, `jekyll-email-protect`, `jekyll-feed`, `jekyll-get-json`, `jekyll-imagemagick`, `jekyll-jupyter-notebook`, `jekyll-link-attributes`, `jekyll-minifier`, `jekyll-paginate-v2`, `jekyll-regex-replace`, `jekyll-scholar`, `jekyll-sitemap`, `jekyll-socials`, `jekyll-tabs`, `jekyll-terser`, `jekyll-toc`, `jekyll-twitter-plugin`, `jemoji`, `classifier-reborn`, `css_parser`, `observer`, `ostruct`, `al_folio_core`, `al_icons`, `al_folio_cv`, `al_folio_distill`, `al_folio_upgrade`, `al_folio_bootstrap_compat`, `al_cookie`, `al_analytics`, `al_citations`, `al_ext_posts`, `al_img_tools`, `al_search`, `al_charts`, `al_math`, `al_comments`, `al_newsletter`, `al_email_protect`, `al_marimo`, `al_rtl`

## Routes / pages

| Route | Kind | Source |
|---|---|---|
| `/` | page (layout: about) | `_pages/about.md` |
| `/404.html` | page (layout: page) | `_pages/404.md` |
| `/about_einstein/` | page (layout: ?) | `_pages/about_einstein.md` |
| `/blog/` | page (layout: default) | `_pages/blog.md` |
| `/books/` | page (layout: book-shelf) | `_pages/books.md` |
| `/cv/` | page (layout: cv) | `_pages/cv.md` |
| `/dropdown/` | page (layout: page) | `_pages/dropdown.md` |
| `/news/` | page (layout: page) | `_pages/news.md` |
| `/people/` | page (layout: profiles) | `_pages/profiles.md` |
| `/plugins/` | page (layout: page) | `_pages/plugins.md` |
| `/projects/` | page (layout: page) | `_pages/projects.md` |
| `/publications/` | page (layout: page) | `_pages/publications.md` |
| `/repositories/` | page (layout: page) | `_pages/repositories.md` |
| `/teaching/` | page (layout: page) | `_pages/teaching.md` |

## Design tokens

**other** (1)

| Token | Value |
|---|---|
| `--i` | `o+=r` |

- Google Fonts: —
- Tailwind `@theme` files: —
- Dark-mode rules in: —

## Client-side behaviour

- DOM events: `test`×1
- data-* hooks: —
- Browser APIs: localStorage (3 files), fetch() (1 files), matchMedia (theme/breakpoints) (1 files)

## External resources

- Script hosts: —
- Stylesheet/link hosts: —

## SEO

- In templates: canonical URL
- Generated: robots.txt

## Content & data

- `_posts/` — 33 Markdown file(s)
- `_pages/` — 14 Markdown file(s)
- `_projects/` — 9 Markdown file(s)
- `_news/` — 3 Markdown file(s)
- `_teachings/` — 2 Markdown file(s)
- `_books/` — 1 Markdown file(s)
- data: `_bibliography/papers.bib`
- data: `_config.yml`
- data: `_data/citations.yml`
- data: `_data/coauthors.yml`
- data: `_data/cv.yml`
- data: `_data/featured_plugins.yml`
- data: `_data/repositories.yml`
- data: `_data/socials.yml`
- data: `_data/venues.yml`

## Rebuild blueprint

1. Source uses Jekyll (Ruby, Liquid templates); a dependency-free rebuild maps each route to a static HTML page and each component to a reusable HTML/CSS pattern (or a JS render function fed by JSON data).
2. Recreate the design system first: 1 CSS custom properties → one `tokens.css` (:root).
3. Content lives in Markdown collections → export to a JSON array and render lists/detail views in JS.
4. Publications come from BibTeX → write a small BibTeX parser that renders grouped-by-year entries.
5. Verify with headless browser screenshots at desktop (1440px) and phone (390px) widths.
