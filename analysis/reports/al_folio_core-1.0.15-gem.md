# Site analysis — al_folio_core 1.0.15 (theme gem behind al-folio)

- **Framework:** Static HTML/CSS/JS  
- **Generator/build:** none (no build step)  
- **Styling:** Tailwind CSS, Sass/SCSS  
- **License:** MIT  
- **Hosting hints:** —  
- **Last commit:** —

## Language mix

| Language | Files | Lines |
|---|---:|---:|
| Liquid | 60 | 2943 |
| JavaScript | 16 | 3125 |
| SCSS | 14 | 2563 |
| CSS | 9 | 9252 |
| Markdown | 2 | 140 |
| YAML | 2 | 43 |
| Ruby | 2 | 324 |

Raster images: 0

## Directory map

```
_includes/                         47 files
  └ plugins/                       21
  └ repository/                     3
assets/                            25 files
  └ js/                            15
  └ css/                            7
  └ tailwind/                       3
_sass/                             13 files
_layouts/                          13 files
(root files)                        3 files
migrations/                         2 files
lib/                                2 files
  └ al_folio_core/                  1
_scripts/                           1 files
```

## Routes / pages

| Route | Kind | Source |
|---|---|---|
| — | — | — |

## Components

- **_includes** (47): al_analytics_scripts, al_charts_scripts, al_comments, al_cookie_scripts, al_cookie_styles, al_email_protect_scripts, al_email_protect_styles, al_icons_styles, al_img_tools_scripts, al_img_tools_styles, al_marimo_scripts, al_marimo_styles, al_math_scripts, al_math_styles, al_newsletter_form_center, al_newsletter_form_center_margin, al_newsletter_form_left, al_newsletter_scripts, al_rtl_html_attrs, al_rtl_styles, al_search_assets, audio, bib_search, calendar, citation, course_schedule, courses, disqus, figure, footer, giscus, head, header, latest_posts, metadata, news, newsletter, pagination, projects, projects_horizontal, related_posts, repo, repo_trophies, repo_user, scripts, selected_papers, video
- **_layouts** (13): about, archive, bib, book-review, book-shelf, course, cv, default, distill, none, page, post, profiles

## Design tokens

**color** (108)

| Token | Value |
|---|---|
| `--swiper-navigation-color` | `var(--global-theme-color)` |
| `--swiper-pagination-color` | `var(--global-theme-color)` |
| `--swiper-pagination-bullet-inactive-color` | `var(--global-text-color)` |
| `--ninja-accent-color` | `var(--global-theme-color)` |
| `--global-divider-color` | `rgba(0, 0, 0, 0.1)` |
| `--global-tip-block` | `#42b983` |
| `--global-tip-block-bg` | `#e2f5ec` |
| `--global-tip-block-text` | `#215d42` |
| `--global-tip-block-title` | `#359469` |
| `--global-warning-block` | `#e7c000` |
| `--global-warning-block-bg` | `#fff8d8` |
| `--global-warning-block-text` | `#6b5900` |
| `--global-warning-block-title` | `#b29400` |
| `--global-danger-block` | `#c00` |
| `--global-danger-block-bg` | `#ffe0e0` |
| `--global-danger-block-text` | `#600` |
| `--global-danger-block-title` | `#c00` |
| `--color-red-700` | `oklch(50.5% .213 27.518)` |
| `--color-orange-50` | `oklch(98% .016 73.684)` |
| `--color-orange-700` | `oklch(55.3% .195 38.402)` |
| `--color-amber-50` | `oklch(98.7% .022 95.277)` |
| `--color-lime-400` | `oklch(84.1% .238 128.85)` |
| `--color-green-700` | `oklch(52.7% .154 150.069)` |
| `--color-teal-600` | `oklch(60% .118 184.704)` |
| `--color-cyan-500` | `oklch(71.5% .143 215.221)` |
| `--color-blue-200` | `oklch(88.2% .059 254.128)` |
| `--color-blue-900` | `oklch(37.9% .146 265.522)` |
| `--color-pink-700` | `oklch(52.5% .223 3.958)` |
| `--color-pink-800` | `oklch(45.9% .187 3.815)` |
| `--color-gray-50` | `oklch(98.5% .002 247.839)` |
| `--color-gray-100` | `oklch(96.7% .003 264.542)` |
| `--color-gray-200` | `oklch(92.8% .006 264.531)` |
| `--color-gray-300` | `oklch(87.2% .01 258.338)` |
| `--color-gray-400` | `oklch(70.7% .022 261.325)` |
| `--color-gray-500` | `oklch(55.1% .027 264.364)` |
| `--color-gray-600` | `oklch(44.6% .03 256.802)` |
| `--color-gray-700` | `oklch(37.3% .034 259.733)` |
| `--color-gray-800` | `oklch(27.8% .033 256.848)` |
| `--color-gray-900` | `oklch(21% .034 264.665)` |
| `--color-white` | `#fff` |

**font-family** (15)

| Token | Value |
|---|---|
| `--fa-font` | `var(--fa-font-solid)` |
| `--jp-ui-font-color0` | `rgba(0, 0, 0, 1)` |
| `--jp-ui-font-color1` | `rgba(0, 0, 0, 0.87)` |
| `--jp-ui-font-color2` | `rgba(0, 0, 0, 0.54)` |
| `--jp-ui-font-color3` | `rgba(0, 0, 0, 0.38)` |
| `--jp-ui-inverse-font-color0` | `rgba(255, 255, 255, 1)` |
| `--jp-ui-inverse-font-color1` | `rgba(255, 255, 255, 1)` |
| `--jp-ui-inverse-font-color2` | `rgba(255, 255, 255, 0.7)` |
| `--jp-ui-inverse-font-color3` | `rgba(255, 255, 255, 0.5)` |
| `--jp-content-font-color0` | `rgba(0, 0, 0, 1)` |
| `--jp-content-font-color1` | `rgba(0, 0, 0, 0.87)` |
| `--jp-content-font-color2` | `rgba(0, 0, 0, 0.54)` |
| `--jp-content-font-color3` | `rgba(0, 0, 0, 0.38)` |
| `--jp-cell-prompt-not-active-font-color` | `var(--md-grey-700)` |
| `--jp-search-toggle-off-opacity` | `0.5` |

**font-weight** (4)

| Token | Value |
|---|---|
| `--font-weight-light` | `300` |
| `--font-weight-medium` | `500` |
| `--font-weight-semibold` | `600` |
| `--font-weight-bold` | `700` |

**motion** (3)

| Token | Value |
|---|---|
| `--ease-in` | `cubic-bezier(.4,0,1,1)` |
| `--ease-out` | `cubic-bezier(0,0,.2,1)` |
| `--default-transition-duration` | `.15s` |

**other** (11)

| Token | Value |
|---|---|
| `--ninja-modal-background` | `var(--global-bg-color)` |
| `--ninja-z-index` | `1031` |
| `--jp-cell-editor-background` | `var(--md-grey-100)` |
| `--jp-cell-prompt-not-active-opacity` | `0.5` |
| `--jp-rendermime-table-row-background` | `var(--md-grey-100)` |
| `--jp-rendermime-table-row-hover-background` | `var(--md-light-blue-50)` |
| `--jp-toolbar-active-background` | `var(--md-grey-300)` |
| `--jp-input-active-background` | `var(--jp-layout-color1)` |
| `--jp-input-hover-background` | `var(--jp-layout-color1)` |
| `--jp-input-background` | `var(--md-grey-100)` |
| `--jp-vega-background` | `white` |

**radius** (4)

| Token | Value |
|---|---|
| `--radius-sm` | `.25rem` |
| `--radius-md` | `.375rem` |
| `--radius-lg` | `.5rem` |
| `--jp-scrollbar-thumb-radius` | `9px` |

**shadow** (2)

| Token | Value |
|---|---|
| `--jp-shadow-base-lightness` | `0` |
| `--jp-toolbar-box-shadow` | `0px 0px 2px 0px rgba(0, 0, 0, 0.24)` |

**spacing/size** (9)

| Token | Value |
|---|---|
| `--ninja-icon-size` | `0px` |
| `--max-content-width` | `930px` |
| `--spacing` | `.25rem` |
| `--breakpoint-sm` | `40rem` |
| `--breakpoint-md` | `48rem` |
| `--breakpoint-lg` | `64rem` |
| `--breakpoint-xl` | `80rem` |
| `--jp-scrollbar-endpad` | `3px` |
| `--jp-scrollbar-thumb-margin` | `3.5px` |

- Google Fonts: —
- Tailwind `@theme` files: —
- Dark-mode rules in: _includes/head.liquid, _sass/_themes.scss

## Client-side behaviour

- DOM events: `click`×12, `DOMContentLoaded`×10, `load`×4, `input`×3, `mouseenter`×2, `focus`×2, `mouseleave`×2, `blur`×2, `change`×2, `scroll`×2, `resize`×2, `keydown`×1, `readystatechange`×1, `hashchange`×1
- data-* hooks: `[data-nav-toggle]`, `[data-nav-dropdown-toggle]`
- Browser APIs: clipboard (2 files), localStorage (2 files), matchMedia (theme/breakpoints) (2 files), fetch() (1 files), scroll handling (1 files)

## External resources

- Script hosts: d1bxh8uas1mnw7.cloudfront.net×1, badge.dimensions.ai×1
- Stylesheet/link hosts: —

## SEO

- In templates: Open Graph, canonical URL, meta description, Twitter card, JSON-LD structured data
- Generated: —

## Content & data


## Rebuild blueprint

1. Single HTML document; replicate as-is with semantic sections and one CSS + one JS file.
2. Recreate the design system first: 156 CSS custom properties → one `tokens.css` (:root).
3. Dark mode exists: implement `prefers-color-scheme` + a persisted toggle (localStorage) on <html>.
4. Interactions are bound through data-* hooks: [data-nav-toggle], [data-nav-dropdown-toggle] → keep the same hook pattern.
5. Verify with headless browser screenshots at desktop (1440px) and phone (390px) widths.
