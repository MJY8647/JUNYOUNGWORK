# Site analysis — bunqlabs.com (live site, 2026-11-14)

Source: rendered with headless Chromium (desktop 1440×900, phone 390×844), HTML/CSS/network inspected.
**License:** proprietary (no open-source license). Nothing from this site — code, images, 3D models,
videos, logos, copy — is copied into this repository. Only structure, interaction patterns and
general design-system shape were studied; `studio-site/` is an original implementation.

## Stack

| Layer | Finding |
|---|---|
| Framework | **Astro** (static, `/_astro/*.js` hashed chunks, one `Layout.*.css` of 186 KB) |
| 3D | **Three.js** — GLB models (Draco-compressed) + KTX2/Basis textures, MSDF text (`*-msdf.json/png`) |
| Animation | **GSAP** core + `Flip` + `ScrambleTextPlugin` |
| JS architecture | ~40 lazy ES-module chunks: `app`, `gate` (loader), `cursor`, `intro`, `pen` (hand-drawn marks), `logowall`, `workbar`, `stage`/`scene` (WebGL), `panels`, `rays`, `scrolllock`, `observerhub`, `routes` |
| Hosting | Self-hosted assets on the same origin; Google Tag Manager; reCAPTCHA on the form |
| Fonts | Inter Tight (+ slanted cut), Geist Mono, Nanum Pen Script — all open-licensed (OFL) |

## Page flow (home)

1. **Loader** — percentage counter left, monogram centre, `LOADING` right (mono, tiny).
2. **Floating pill nav** — white rounded capsule centred at top: `MENU` · logo · `LET'S TALK`.
3. **Hero** — sky-blue gradient with diagonal light ray and film grain; 3D mountain with a project
   cover standing on its peak; a thin orbit ellipse with a red ✦ travelling on it; mono eyebrow
   (`AN AWARD WINNING DESIGN STUDIO`); giant one-line headline with a red ✦ separator and a
   hand-drawn red underline under one word.
4. **Manifesto** — the mountain dissolves into a **point cloud**; centred two-line statement mixing
   upright and slanted words, inline 3D emoji images between words, and **pen annotations** drawn in:
   handwritten "we build", a red ellipse around a word, a red underline, a selection box with corner
   handles, "like these" + arrow pointing down to a **client logo wall** that cycles logos.
5. **Work** — a **curved 3D gallery** (cards on the inside of a cylinder, tiled-room backdrop);
   drag / ←→ keys; centre card large with category tab, title, client mark, service tag; bottom bar
   `01 / 14` · `Open project` pill · year; side captions in mono (`SELECTED WORK / 14 PROJECTS`,
   `DRAG TO EXPLORE / OR USE ← → KEYS`); cursor becomes a round "Drag" bubble.
6. **About** — three "portal" cards (Recognition / About / Services) each with a looping 3D clip on a
   dark or red gradient, title top-left, `OPEN` bottom-left.
7. **Contact** — "We'll help you / steer the ship, captain." + black pill `Start a project`.
8. **Footer** — monogram, tagline with doodle marks, newsletter field, "Ask AI about us" icon row,
   socials, page index, coordinates, news ticker.

**Menu overlay:** white card over a blurred page — Pages list (large), Services (Launch / Evolve /
Scale with mono sub-lines), gradient CTA card "Have a project in mind?" + `Book a call`, socials,
theme switch System / Light / Dark.

**Enquiry flow:** 3-step accordion form (details → intent radio cards → service chips), Back/Next,
Send with success/fail states and auto-close countdown.

## Design-system shape (from CSS custom properties)

- Type scale: display `d1…d8` (7.5rem → 1.25rem) each with its own negative tracking
  (−0.041em → −0.004em); text `lg/md/sm`; UI, label, micro, tag sizes.
- Colour: 8 hue families × 5 steps (50/200/500/800/950) + a 10-step neutral ramp
  (white → chalk → mist → fog → stone → graphite → coal → night → near-black → black);
  single **red accent** + warm orange secondary; `[data-theme]` light/dark with a System mode.
- Spacing: 4 px-based scale (`space-1` … `space-40`), 12-column grid, 1.5rem gutter, 1440 ideal.
- Motion: ~40 keyframes (doodles, pen strokes, spinners, ticker); everything gated by
  `prefers-reduced-motion` (30 rules) and `hover:hover` (27 rules).
- Breakpoints: 600 / 767 / 1023 px.

## Rebuild approach used in `studio-site/`

| Original technique | Rebuild (no dependencies) |
|---|---|
| Three.js GLB mountain + KTX2 textures | Canvas 2D procedural ridge-noise mountain with shaded layers |
| Three.js point-cloud transition | Canvas 2D projected point cloud, morph driven by scroll |
| MSDF text + GSAP ScrambleText | Own scramble-text routine |
| Curved WebGL gallery | CSS 3D (`perspective` + `rotateY` on a cylinder), pointer drag with inertia, keys |
| Pen annotations | Inline SVG paths animated with `stroke-dashoffset` |
| Looping 3D portal videos | CSS-animated shapes (rings, star) on gradients |
| GSAP timelines | Web Animations / CSS transitions + IntersectionObserver + scroll progress |
