# Techniques — tested recipes

These recipes come from a working rebuild of a Three.js/GSAP studio site in vanilla JS. Adapt them;
don't paste blindly. Each lists the trap that cost time the first time.

## Contents
1. Theme before first paint (System/Light/Dark)
2. Loader gate
3. Pill nav that hides on scroll
4. Scramble text
5. SVG pen marks (circle, underline, box) drawn on reveal
6. Curved, looping 3D gallery (CSS only)
7. Dialogs, menu focus trap
8. Multi-step enquiry form with mailto fallback
9. Procedural terrain + 2D canvas mountain
10. Point cloud that assembles on scroll
11. Three.js hero with 2D fallback
12. Reveal on scroll (progressive enhancement)
13. Playwright test harness
14. Deploy (GitHub Pages)

## 1. Theme before first paint
Inline in `<head>` so there is no flash:
```html
<script>(function(){var m='system';try{m=localStorage.getItem('theme-mode')||'system'}catch(e){}
var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
var h=document.documentElement;h.dataset.themeMode=m;h.dataset.theme=d?'dark':'light';h.classList.add('is-loading');})();</script>
```
Tokens on `:root`, overrides on `[data-theme="dark"]`. Listen to the media query and re-apply only
when mode is `system`. Anything drawn on canvas must redraw on theme change.

## 2. Loader gate
Counter from 0→100 tied to `document.fonts.ready` (with a timeout), then remove `is-loading`.
Trap: the fading overlay blocks pointer events → `html:not(.is-loading) .gate { opacity:0; visibility:hidden; pointer-events:none; }`.
With reduced motion, skip the counter.

## 3. Pill nav
Fixed, centred capsule. On scroll: hide when scrolling down past 120px, show when scrolling up
(`transform: translateY(-140%)`). Menu button toggles a full overlay with `aria-expanded`.

## 4. Scramble text
```js
const GLYPHS = '!<>-_/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function scramble(el, to, dur = 600) {
  if (reduced.matches) { el.textContent = to; return; }
  const from = el.textContent, len = Math.max(from.length, to.length), t0 = performance.now();
  cancelAnimationFrame(el._scr);
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / dur); let out = '';
    for (let i = 0; i < len; i++) out += k > (i / len) * .7 + .3 ? (to[i] || '') : (to[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]);
    el.textContent = out;
    if (k < 1) el._scr = requestAnimationFrame(tick); else el.textContent = to;
  };
  el._scr = requestAnimationFrame(tick);
}
```
Use for logo walls (cycle names every ~2.4s) and hover on mono labels.

## 5. SVG pen marks
Wrap the target word in an inline-block span; append an absolutely positioned `<svg>` with a hand
path using `pathLength="1"`, `stroke-dasharray:1; stroke-dashoffset:1`, and transition to 0 when the
parent gets `.is-in`. Handwritten notes: Nanum Pen Script (OFL, Korean). Trap: notes positioned in %
of the paragraph drift on resize — anchor them to a span inside the text.

## 6. Curved looping gallery
Each card: `transform: translateZ(-R) rotateY(a) translateZ(R)` where `a = d * step`, with the
wrapped offset `d = (((i - pos) % N) + N * 1.5) % N - N / 2` so it loops infinitely. Drag with
inertia (velocity decays 0.92/frame), ←/→ keys, horizontal swipe, snap to nearest. Bottom bar shows
`01 / N`. Custom round "Drag" cursor on hover (pointer: fine only).

## 7. Dialogs and menu
Use `<dialog>` + `showModal()` (free Esc and focus handling). For the menu overlay, trap Tab inside
and return focus to the opener on close.

## 8. Enquiry form
Three steps, validate each before moving on (`reportValidity()`), radio intents + toggle chips,
final submit builds a `mailto:` with all fields (no backend needed); success state with a 10s
countdown back to step 1. Tell the user to swap in Formspree/their API if they have one.

## 9. Procedural terrain
Seeded Perlin fBm; a massif = gaussian base × ridge noise:
```js
const height = (x, z) => { const r = Math.sqrt(x*x*.9 + z*z*1.6); const base = Math.exp(-r*r*2.2);
  const ridge = 1 - Math.abs(noise(x*2.2+3, z*2.2+1, 5)); return base*(.7+.5*ridge*ridge) + noise(x*5, z*5, 3)*.04*base; };
```
Share this one function between the 2D mountain, the WebGL mesh and the point cloud
(`window.__terrain = { height, noise }`) so the transitions line up. Publish the summit's pixel
height as a CSS var (`--peak`) so DOM elements (a cover, a product) can stand exactly on the peak.
Traps: tall screens make it spiky → cap amplitude by aspect ratio; widen the massif on wide screens.

## 10. Point cloud
Sample ~5k points of `height()`, rotate slowly, project with a simple pinhole camera, and stagger
an "assemble" factor per point from section scroll progress. Read the dot color from a CSS var so
it follows the theme. Pause when the section is off screen (IntersectionObserver).

## 11. Three.js hero with fallback
- Source in `src/hero3d.js`, bundled to a classic IIFE so it runs from `file://` (ES modules don't):
  `npx esbuild src/hero3d.js --bundle --minify --format=iife --legal-comments=inline --outfile=assets/hero3d.js`
  (three@0.180 tree-shakes to ~480 KB). Load it after `app.js`.
- Try `new WebGLRenderer(...)` in try/catch; on success add `webgl-hero` to `<html>` and hide the 2D
  canvas with CSS; the 2D draw function returns early when that class is present.
- Mesh: `PlaneGeometry` rotated flat, Y from `height()`, vertex colors (rock by strata/slope, snow
  above a noisy snow line on gentle slopes, pale scree low), `MeshStandardMaterial`, warm sun +
  cool rim + hemisphere light, `Fog` in the sky-bottom color, ACES tone mapping.
- Keep a DOM object on the summit: each frame project the summit vertex, and solve the camera's
  look-at height (a few secant steps) so the summit sits at a fixed fraction of the hero height;
  write `--peak`.
- Scroll dissolve: `Points` from the mesh vertices with a per-point random direction and seed;
  vertex shader `k = smoothstep(s*.45, s*.45+.55, uP)`, `p = position + dir*k*k*1.1`; clamp
  `gl_PointSize` or near points become huge blobs. Fade the mesh opacity out over the first third.
- Mask the canvas bottom (`mask-image: linear-gradient(#000 72%, transparent)`) so the flat valley
  melts into the page. Portrait screens: wider FOV and step the camera back.
- Handle `webglcontextlost` by falling back to 2D. Theme: MutationObserver on `data-theme`.
- Test: a WebGL canvas can't be read back with `drawImage` (no preserveDrawingBuffer) → compare a
  screenshot clip with the canvas visible vs `visibility:hidden`. Test the fallback by stubbing
  `getContext('webgl*')` to return null in `addInitScript`.

## 12. Reveal on scroll
Only hide elements once JS has added `.reveal-ready` to `<html>`, so no-JS and screenshot tools
still see content. For screenshots, scroll with `behavior: 'instant'`.

## 13. Playwright harness
`require('playwright')`, `chromium.launch()`, collect `pageerror` and console errors (ignore
`Failed to load resource` for offline fonts), wait for `is-loading` to disappear. Run pages one at a
time with SwiftShader WebGL — parallel pages can stall the loader past timeouts.

## 14. Deploy
GitHub Actions: job `test` (setup-node 22, `npm install --no-save playwright@<ver>`,
`npx playwright install --with-deps chromium`, run tests) then `deploy` with
`actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` (path `_site`, tests excluded,
`.nojekyll`), `actions/deploy-pages@v4`, permissions `pages: write, id-token: write`.
