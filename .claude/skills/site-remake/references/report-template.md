# Site analysis — <host> (<live site | video>, <YYYY-MM-DD>)

Source: <how it was inspected: static fetch, headless Chromium at 1440×900 / 390×844, frames from video>.
**License:** <proprietary | MIT/…>. <Nothing copied — only structure, interaction patterns and the
shape of the design system were studied. | Attribution kept per license.>

## Stack

| Layer | Finding |
|---|---|
| Framework | e.g. Astro / Next.js / Webflow / plain (evidence: `/_astro/` chunks, `__NEXT_DATA__`, `data-wf-*`) |
| 3D | e.g. Three.js (GLB+Draco, KTX2), Spline, none |
| Animation | e.g. GSAP (+ScrollTrigger/Flip/ScrambleText), Lenis, Framer Motion, CSS only |
| Fonts | name + license |
| Other | analytics, forms, captcha, CMS |

## Page flow

Numbered list, one entry per section, top to bottom: what is on screen, how it moves, what it is for.

## Design-system shape

Colors (bg/ink/accent, dark-theme counterparts), type scale (display sizes, tracking, mono label size),
spacing scale, radii, easing curves and durations, grain/texture overlays.

## Interaction inventory

| Interaction | Trigger | Likely technique |
|---|---|---|

## Rebuild plan

| Original technique | Our implementation | Why |
|---|---|---|
