---
name: site-remake
description: Reverse-engineer a reference website (from a URL, a screen recording, or screenshots) and rebuild its structure, interactions and design system as original code filled with the user's own content — a book, a brand, a portfolio, a program. Covers live-site recon (stack, sections, design tokens, motion), an original vanilla HTML/CSS/JS rebuild with a single content file, an optional Three.js 3D hero, Playwright tests and screenshots, a single-file preview and GitHub Pages deploy. Use this whenever the user shares a site link and says things like "이 사이트 역설계해줘", "이런 느낌으로 만들어줘", "이 디자인을 우리 거에 적용해줘", "clone this site's look for my brand", "make my landing page work like this one", or shows a video of a site they want to copy the feel of — even if they don't say "reverse-engineer".
---

# Site remake: reference site → your own site

The user has a site they admire and content of their own. The job is to learn *how* the reference
site works (layout, sections, motion, tokens) and rebuild that experience from scratch around the
user's content. It is not to download and re-host someone else's site.

## Ground rules (why they matter)

- **Copy patterns, not property.** Most commercial sites are proprietary. Their code, images,
  3D models, videos, logos and copy can't be reused; layout ideas, interaction patterns, spacing and
  type scales can. Write every line fresh and use only open-licensed fonts/assets (OFL fonts, CC0
  textures, MIT libraries). Say this once in the report and the README so the user isn't surprised.
  If the reference *is* open source, check its license and keep attribution.
- **Never claim a fact about the user's content you haven't verified.** When filling in a book,
  product or person, pull facts from reliable sources (publisher/bookstore pages, the user's own
  materials), record the source and date, and mark anything you wrote yourself as `draft: true`
  in the content file. Short excerpts get page numbers and a note that permission should be
  obtained.
- **Keep it buildless by default.** Plain HTML/CSS/JS opens from `file://`, deploys anywhere and is
  easy for the user to edit. Add a bundler only for a heavy library (e.g. Three.js), and commit the
  built file so the site still runs without a build step.

## Workflow

### 1. Get the reference

- **URL** → run `scripts/recon.py <url> --out analysis/<host>` (static fetch: stack, fonts, CSS
  custom properties, scripts, meta). Then render it with Playwright (`scripts/capture.js <url>
  <outdir>`) at 1440×900 and 390×844, scrolled through, to see what the HTML alone doesn't show.
  If the network blocks the host, say so and ask the user to allow it (in cloud sessions, use the
  environment tools) rather than guessing from memory.
- **Video or screenshots only** → extract frames (`ffmpeg -i in.mp4 -vf fps=1 frames/%03d.png`),
  look at them, and describe sections and motion from what is visible. Tell the user which parts
  are inferred.

### 2. Write the analysis report

`analysis/reports/<host>.md`, using the template in `references/report-template.md`: stack, page
flow section by section, design-system shape (colors, type scale, spacing, radii, easing),
interaction inventory, the technique each effect probably uses, and the rebuild plan mapping each
original technique to the one you'll use. Keep the license note at the top.

### 3. Map the user's content onto the structure

Before coding, make a table: *reference section → what it becomes for the user*. A client logo
wall can become a cycling list of key concepts; a work gallery can become chapters or products; a
"Let's talk" block can become "Buy the book". Show this table to the user in plain language; it's
the moment they can redirect cheaply.

Put **all** copy and data in one `assets/content.js` (`window.SITE = {...}`) so the user edits one
file. Placeholders (email, socials) get a `// TODO` comment.

### 4. Build

Layout: `site/index.html`, `assets/styles.css` (tokens on `:root` first, dark theme overrides
next), `assets/app.js` (render from `SITE`, then one function per behavior), `test/site.test.js`.
See `references/techniques.md` for tested recipes of the effects these sites usually have: loader
gate, pill nav that hides on scroll, scramble text, SVG pen marks, curved looping 3D gallery,
dialogs, multi-step form with mailto fallback, System/Light/Dark theme, point cloud, procedural
terrain, and a Three.js hero with a 2D fallback.

Respect `prefers-reduced-motion`, keep every feature keyboard-usable, and make sure the page works
at 390px width with no horizontal scroll.

### 5. Verify like a user would

- Playwright tests: loads with no JS errors, nav/menu/dialogs work, gallery moves, form validates,
  theme persists, mobile has no overflow, reduced-motion path works, and (if WebGL) the canvas
  actually draws and the 2D fallback kicks in without WebGL.
- Screenshots at desktop and mobile, light and dark. **Look at them** and fix what looks wrong
  (overlaps, spiky shapes, text collisions) before reporting. This is where most of the quality
  comes from.

### 6. Deliver

- Commit; produce a single-file preview with `scripts/inline.py site/index.html out.html` so the user
  can open it without a server, and send it plus screenshots.
- Offer GitHub Pages: a workflow that runs the tests then deploys (`references/techniques.md` →
  "Deploy"). The user must set Settings → Pages → Source = GitHub Actions once.
- In the final message, in plain language: what was built, what's a placeholder or draft that
  needs their confirmation, and the next upgrade options (real photos/cover, 3D assets, GSAP scroll
  choreography), noting which ones cost money (e.g. AI generation credits) before doing them.

## Closing the visual gap

When the user asks "why doesn't it look like the original?", the honest answer is usually
**assets and tech**, not layout: photoreal 3D models/textures, rendered video loops, real
photography, and libraries like Three.js, GSAP + ScrollTrigger, Lenis. Offer them as separate steps
in order of impact per cost, starting with the user's own real images.
