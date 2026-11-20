# Site analysis — arthelokyo/astrowind

- **Framework:** Astro  
- **Generator/build:** astro ^7.3.1  
- **Styling:** Tailwind CSS  
- **License:** MIT  
- **Hosting hints:** Vercel, Netlify, Cloudflare, Docker  
- **Last commit:** 14e1a69 2026-09-12

## Language mix

| Language | Files | Lines |
|---|---:|---:|
| Astro | 91 | 10747 |
| Markdown | 29 | 2505 |
| TypeScript | 15 | 1825 |
| JSON | 10 | 11097 |
| YAML | 4 | 162 |
| JavaScript | 2 | 79 |
| CSS | 2 | 259 |
| MDX | 2 | 281 |
| TOML | 1 | 9 |
| HTML | 1 | 14 |

Raster images: 6

## Directory map

```
src/                              121 files
  └ components/                    67
  └ pages/                         23
  └ assets/                        10
  └ data/                           7
  └ utils/                          5
  └ layouts/                        4
(root files)                       24 files
.agents/                           16 files
  └ skills/                        16
vendor/                             5 files
  └ integration/                    4
public/                             4 files
  └ decapcms/                       2
.vscode/                            4 files
  └ astrowind/                      1
.github/                            3 files
  └ assets/                         2
  └ workflows/                      1
nginx/                              1 files
```

## Dependencies

**npm:** `@astro-community/astro-embed-twitter@^0.5.11`, `@astro-community/astro-embed-vimeo@^0.3.12`, `@astro-community/astro-embed-youtube@^0.5.10`, `@astrojs/check@^0.9.10`, `@astrojs/markdown-remark@^7.3.0`, `@astrojs/mdx@^8.0.0`, `@astrojs/partytown@^2.1.7`, `@astrojs/rss@^4.0.19`, `@astrojs/sitemap@^3.7.3`, `@eslint/js@^10.0.1`, `@iconify-json/flat-color-icons@^1.2.3`, `@iconify-json/tabler@^1.2.38`, `@tailwindcss/typography@^0.5.20`, `@tailwindcss/vite@^4.3.3`, `@types/js-yaml@^4.0.9`, `@types/lodash.merge@^4.6.9`, `@types/mdx@^2.0.14`, `@typescript-eslint/eslint-plugin@^8.66.0`, `@typescript-eslint/parser@^8.66.0`, `astro@^7.3.1`, `astro-compress@^2.4.3`, `astro-eslint-parser@^3.0.0`, `astro-icon@^1.1.5`, `astro-seo@^1.2.0`, `eslint@^10.8.1`, `eslint-plugin-astro@^3.1.0`, `globals@^17.9.0`, `js-yaml@^4.3.2`, `limax@4.2.3`, `lodash.merge@^4.6.2`, `mdast-util-to-string@^4.0.0`, `prettier@^3.9.6`, `prettier-plugin-astro@^0.14.1`, `reading-time@^1.5.0`, `sharp@^0.35.3`, `tailwind-merge@^3.6.0`, `tailwindcss@^4.3.3`, `typescript@^5.9.3`, `typescript-eslint@^8.66.0`, `unpic@^4.2.2`

## Routes / pages

| Route | Kind | Source |
|---|---|---|
| `/` | page | `src/pages/index.astro` |
| `/*blog` | page | `src/pages/[...blog]/index.astro` |
| `/*blog/*page` | page | `src/pages/[...blog]/[...page].astro` |
| `/*blog/:category/*page` | page | `src/pages/[...blog]/[category]/[...page].astro` |
| `/*blog/:tag/*page` | page | `src/pages/[...blog]/[tag]/[...page].astro` |
| `/404` | page | `src/pages/404.astro` |
| `/about` | page | `src/pages/about.astro` |
| `/contact` | page | `src/pages/contact.astro` |
| `/homes/mobile-app` | page | `src/pages/homes/mobile-app.astro` |
| `/homes/personal` | page | `src/pages/homes/personal.astro` |
| `/homes/saas` | page | `src/pages/homes/saas.astro` |
| `/homes/startup` | page | `src/pages/homes/startup.astro` |
| `/landing/click-through` | page | `src/pages/landing/click-through.astro` |
| `/landing/lead-generation` | page | `src/pages/landing/lead-generation.astro` |
| `/landing/pre-launch` | page | `src/pages/landing/pre-launch.astro` |
| `/landing/product` | page | `src/pages/landing/product.astro` |
| `/landing/sales` | page | `src/pages/landing/sales.astro` |
| `/landing/subscription` | page | `src/pages/landing/subscription.astro` |
| `/pricing` | page | `src/pages/pricing.astro` |
| `/privacy` | page | `src/pages/privacy.md` |
| `/rss.xml` | endpoint | `src/pages/rss.xml.ts` |
| `/services` | page | `src/pages/services.astro` |
| `/terms` | page | `src/pages/terms.md` |

## Components

- **(root)** (3): CustomStyles, Favicons, Logo
- **blog** (10): Grid, GridItem, Headline, List, ListItem, Pagination, RelatedPosts, SinglePost, Tags, ToBlogLink
- **common** (12): Analytics, ApplyColorMode, Breadcrumbs, CommonMeta, Image, Intersect, Metadata, SiteVerification, SocialShare, StructuredData, ToggleMenu, ToggleTheme
- **layouts** (4): LandingLayout, Layout, MarkdownLayout, PageLayout
- **ui** (5): Button, Form, Headline, Timeline, WidgetWrapper
- **widgets** (37): Announcement, Bento, BlogHighlightedPosts, BlogLatestPosts, Brands, CallToAction, Comparison, Contact, Content, Countdown, FAQs, FeatureTabs, Features, Features2, Features3, Footer, Gallery, Header, Hero, Hero2, HeroText, Integrations, Newsletter, Note, Pricing, Projects, QuickStart, Quote, SocialProof, Stats, Steps, Steps2, StickyCTA, Team, Testimonials, Timeline, Video

## Design tokens

**color** (49)

| Token | Value |
|---|---|
| `--aw-color-primary` | `rgb(1 97 239)` |
| `--aw-color-secondary` | `rgb(1 84 207)` |
| `--aw-color-accent` | `rgb(109 40 217)` |
| `--aw-color-text-heading` | `rgb(0 0 0)` |
| `--aw-color-text-default` | `rgb(16 16 16)` |
| `--aw-color-text-muted` | `rgb(16 16 16 / 66%)` |
| `--aw-color-bg-page` | `rgb(255 255 255)` |
| `--aw-color-bg-page-dark` | `rgb(8 9 10)` |
| `--color-primary` | `var(--aw-color-primary)` |
| `--color-secondary` | `var(--aw-color-secondary)` |
| `--color-accent` | `var(--aw-color-accent)` |
| `--color-heading` | `var(--aw-color-text-heading)` |
| `--color-default` | `var(--aw-color-text-default)` |
| `--color-muted` | `var(--aw-color-text-muted)` |
| `--color-link` | `var(--aw-color-link, var(--aw-color-primary))` |
| `--primary-foreground` | `#fff` |
| `--secondary-foreground` | `#fff` |
| `--accent-foreground` | `#fff` |
| `--destructive` | `oklch(57.7% 0.245 27.325)` |
| `--destructive-foreground` | `#fff` |
| `--sidebar-primary-foreground` | `#fff` |
| `--color-background` | `var(--background)` |
| `--color-foreground` | `var(--foreground)` |
| `--color-card` | `var(--card)` |
| `--color-card-foreground` | `var(--card-foreground)` |
| `--color-popover` | `var(--popover)` |
| `--color-popover-foreground` | `var(--popover-foreground)` |
| `--color-primary-foreground` | `var(--primary-foreground)` |
| `--color-secondary-foreground` | `var(--secondary-foreground)` |
| `--color-accent-foreground` | `var(--accent-foreground)` |
| `--color-muted-foreground` | `var(--muted-foreground)` |
| `--color-destructive` | `var(--destructive)` |
| `--color-destructive-foreground` | `var(--destructive-foreground)` |
| `--color-border` | `var(--border)` |
| `--color-input` | `var(--input)` |
| `--color-ring` | `var(--ring)` |
| `--color-chart-1` | `var(--chart-1)` |
| `--color-chart-2` | `var(--chart-2)` |
| `--color-chart-3` | `var(--chart-3)` |
| `--color-chart-4` | `var(--chart-4)` |

**font-family** (6)

| Token | Value |
|---|---|
| `--aw-font-sans` | `var(--font-inter)` |
| `--aw-font-serif` | `var(--font-inter)` |
| `--aw-font-heading` | `var(--font-inter)` |
| `--font-sans` | `var(--aw-font-sans, ui-sans-serif), ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'` |
| `--font-serif` | `var(--aw-font-serif, ui-serif), ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif` |
| `--font-heading` | `var(--aw-font-heading, ui-sans-serif), ui-sans-serif, system-ui, sans-serif` |

**other** (27)

| Token | Value |
|---|---|
| `--animate-fade` | `fadeInUp 0.5s both` |
| `--background` | `var(--aw-color-bg-page)` |
| `--foreground` | `var(--aw-color-text-default)` |
| `--card` | `var(--aw-color-bg-page)` |
| `--card-foreground` | `var(--aw-color-text-default)` |
| `--popover` | `var(--aw-color-bg-page)` |
| `--popover-foreground` | `var(--aw-color-text-default)` |
| `--primary` | `var(--aw-color-primary)` |
| `--secondary` | `var(--aw-color-secondary)` |
| `--accent` | `var(--aw-color-accent)` |
| `--muted` | `color-mix(in oklab, var(--aw-color-text-default) 6%, var(--aw-color-bg-page))` |
| `--muted-foreground` | `var(--aw-color-text-muted)` |
| `--border` | `color-mix(in oklab, var(--aw-color-text-default) 15%, var(--aw-color-bg-page))` |
| `--input` | `color-mix(in oklab, var(--aw-color-text-default) 15%, var(--aw-color-bg-page))` |
| `--ring` | `var(--aw-color-primary)` |
| `--chart-1` | `var(--aw-color-primary)` |
| `--chart-2` | `var(--aw-color-accent)` |
| `--chart-3` | `var(--aw-color-secondary)` |
| `--chart-4` | `color-mix(in oklab, var(--aw-color-primary) 55%, var(--aw-color-bg-page))` |
| `--chart-5` | `color-mix(in oklab, var(--aw-color-accent) 55%, var(--aw-color-bg-page))` |
| `--sidebar` | `var(--aw-color-bg-page)` |
| `--sidebar-foreground` | `var(--aw-color-text-default)` |
| `--sidebar-primary` | `var(--aw-color-primary)` |
| `--sidebar-accent` | `color-mix(in oklab, var(--aw-color-text-default) 6%, var(--aw-color-bg-page))` |
| `--sidebar-accent-foreground` | `var(--aw-color-text-default)` |
| `--sidebar-border` | `color-mix(in oklab, var(--aw-color-text-default) 15%, var(--aw-color-bg-page))` |
| `--sidebar-ring` | `var(--aw-color-primary)` |

**radius** (1)

| Token | Value |
|---|---|
| `--radius` | `0.625rem` |

- Google Fonts: —
- Tailwind `@theme` files: src/assets/styles/tailwind.css, src/assets/styles/shadcn.css
- Dark-mode rules in: src/assets/styles/shadcn.css, src/assets/styles/tailwind.css, src/components/CustomStyles.astro, src/components/common/ApplyColorMode.astro

## Client-side behaviour

- DOM events: `click`×13, `scroll`×7, `keydown`×2, `astro:after-swap`×1, `aw:theme-change`×1, `astro:page-load`×1, `change`×1
- data-* hooks: `[data-aw-toggle-color-scheme]`, `[data-aw-gallery-prev]`, `[data-aw-gallery-next]`
- Browser APIs: web components (12 files), history/View Transitions (3 files), matchMedia (theme/breakpoints) (3 files), localStorage (2 files), IntersectionObserver (2 files), clipboard (1 files), scroll handling (1 files)

## External resources

- Script hosts: identity.netlify.com×1, unpkg.com×1
- Stylesheet/link hosts: images.unsplash.com×1

## SEO

- In templates: Open Graph, canonical URL, Twitter card, JSON-LD structured data
- Generated: sitemap, RSS/Atom feed, robots.txt

## Content & data

- `src/data/post/` — 7 Markdown file(s)
- `src/pages/` — 2 Markdown file(s)
- data: `src/config.yaml`

## Rebuild blueprint

1. Source uses Astro; a dependency-free rebuild maps each route to a static HTML page and each component to a reusable HTML/CSS pattern (or a JS render function fed by JSON data).
2. Recreate the design system first: 83 CSS custom properties → one `tokens.css` (:root).
3. Dark mode exists: implement `prefers-color-scheme` + a persisted toggle (localStorage) on <html>.
4. Interactions are bound through data-* hooks: [data-aw-toggle-color-scheme], [data-aw-gallery-prev], [data-aw-gallery-next] → keep the same hook pattern.
5. Content lives in Markdown collections → export to a JSON array and render lists/detail views in JS.
6. Verify with headless browser screenshots at desktop (1440px) and phone (390px) widths.
