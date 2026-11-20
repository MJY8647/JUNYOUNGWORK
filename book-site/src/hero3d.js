// WebGL hero: a lit 3D massif that dissolves into a point cloud as you scroll.
// Built into assets/hero3d.js (classic script, works from file://):
//   npx esbuild book-site/src/hero3d.js --bundle --minify --format=iife --outfile=book-site/assets/hero3d.js
// The terrain height function comes from app.js (window.__terrain) so the
// mesh, the 2D fallback and the manifesto point cloud share one shape.
import {
  WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, Mesh, MeshStandardMaterial,
  DirectionalLight, HemisphereLight, Fog, Color, BufferGeometry, BufferAttribute, Points,
  ShaderMaterial, Vector3, SRGBColorSpace, ACESFilmicToneMapping, AdditiveBlending, NormalBlending,
} from 'three';

(function () {
  const root = document.documentElement;
  const hero = document.querySelector('[data-hero]');
  const T = window.__terrain;
  if (!hero || !T) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const css = (name, fb) => getComputedStyle(root).getPropertyValue(name).trim() || fb;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero__mountain3d';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.dataset.mountain3d = '';
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return; } // no WebGL → keep the 2D canvas mountain
  if (!renderer.getContext()) return;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  hero.querySelector('[data-mountain]').after(canvas);
  root.classList.add('webgl-hero');

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, .05, 30);
  const H = .72; // vertical scale of the massif

  /* ---------- terrain mesh ---------- */
  function terrain(w, d, sx, sz, opts) {
    const g = new PlaneGeometry(w, d, sx, sz); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, opts.h(x, z));
    }
    g.computeVertexNormals();
    const nrm = g.attributes.normal; const col = new Float32Array(pos.count * 3);
    const c = new Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), ny = nrm.getY(i);
      const fine = T.noise(x * 38, z * 38, 2), mid = T.noise(x * 9 + 5, z * 9, 3);
      // rock: cool grey with strata, darker on steep faces
      const strata = .5 + .5 * Math.sin(y * 90 + mid * 6);
      const rock = .2 + .12 * strata + .1 * fine - (1 - ny) * .12;
      c.setRGB(rock * .96, rock * .98, rock * 1.04);
      // snow settles on gentle, high slopes
      const snowLine = opts.snow - mid * .14;
      const snow = clamp((y - snowLine) * 6, 0, 1) * clamp((ny - .35) * 3 + fine * 1.5, 0, 1);
      c.lerp(new Color(.93, .95, .98), snow);
      // valley floor: pale scree that melts into the mist
      const low = clamp(1 - y / .12, 0, 1);
      c.lerp(new Color(.62, .65, .69), low * .8);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new BufferAttribute(col, 3));
    return g;
  }
  const SX = 1.35; // stretch the massif sideways: a broad mountain reads calmer than a spike
  const mainGeo = terrain(7, 6, 420, 300, { h: (x, z) => T.height(x / SX, z) * H, snow: .42 });
  const rockMat = new MeshStandardMaterial({ vertexColors: true, roughness: .93, metalness: 0, transparent: true });
  const massif = new Mesh(mainGeo, rockMat); scene.add(massif);

  const backGeo = terrain(12, 2.4, 260, 60, { h: (x, z) => (T.height(x * .55 + .9, z * .6 + .6) * .62 + .04) * H, snow: .36 });
  const backMat = new MeshStandardMaterial({ vertexColors: true, roughness: 1, transparent: true });
  const back = new Mesh(backGeo, backMat); back.position.set(0, -.02, -3.4); scene.add(back);

  // summit (highest vertex near the centre) — the book cover stands on it
  const summit = new Vector3();
  { const p = mainGeo.attributes.position; let best = -1;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); if (Math.abs(x) < .45 && p.getY(i) > best) { best = p.getY(i); summit.set(x, best, p.getZ(i)); } } }

  /* ---------- lights & fog ---------- */
  const sun = new DirectionalLight(0xfff3e2, 2.6); sun.position.set(-2.2, 2.4, 1.6); scene.add(sun);
  const rim = new DirectionalLight(0xbfd6ff, .7); rim.position.set(2.5, 1, -2); scene.add(rim);
  const hemi = new HemisphereLight(0xcfe2ff, 0x6c6f75, .9); scene.add(hemi);
  scene.fog = new Fog(0xeef1f4, 3, 8.5);

  /* ---------- point cloud (same surface, sampled) ---------- */
  // only the massif itself (not the flat valley) becomes the cloud
  const src = mainGeo.attributes.position; const idx = [];
  for (let i = 0; i < src.count; i++) if (src.getY(i) > .03 || Math.random() < .08) idx.push(i);
  const n = Math.min(idx.length, 26000); idx.sort(() => Math.random() - .5);
  const pp = new Float32Array(n * 3), dir = new Float32Array(n * 4);
  for (let k = 0; k < n; k++) { const i = idx[k];
    pp.set([src.getX(i) + (Math.random() - .5) * .01, src.getY(i), src.getZ(i) + (Math.random() - .5) * .01], k * 3);
    const a = Math.random() * Math.PI * 2, up = Math.random();
    dir.set([Math.cos(a) * (.4 + Math.random()), .3 + up * 1.2, Math.sin(a) * (.4 + Math.random()), Math.random()], k * 4);
  }
  const cloudGeo = new BufferGeometry();
  cloudGeo.setAttribute('position', new BufferAttribute(pp, 3));
  cloudGeo.setAttribute('aDir', new BufferAttribute(dir, 4));
  const cloudMat = new ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uP: { value: 0 }, uTime: { value: 0 }, uColor: { value: new Color(.08, .08, .08) }, uPx: { value: 1 } },
    vertexShader: `
      attribute vec4 aDir; uniform float uP, uTime, uPx; varying float vA;
      void main() {
        float s = aDir.w;
        float k = smoothstep(s * .45, s * .45 + .55, uP);           // staggered release
        vec3 p = position + aDir.xyz * k * k * 1.1;
        p += vec3(sin(uTime * .6 + s * 40.), cos(uTime * .5 + s * 30.), 0.) * .012 * k;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min(uPx * (1. + .6 * k) * (3. / -mv.z), uPx * 2.2);
        vA = smoothstep(.0, .18, uP) * (1. - smoothstep(.75, 1., uP)) * (.25 + .55 * fract(s * 7.));
      }`,
    fragmentShader: `
      uniform vec3 uColor; varying float vA;
      void main() { vec2 d = gl_PointCoord - .5; if (dot(d, d) > .25) discard; gl_FragColor = vec4(uColor, vA); }`,
  });
  const cloud = new Points(cloudGeo, cloudMat); cloud.frustumCulled = false; scene.add(cloud);

  /* ---------- theme ---------- */
  function applyTheme() {
    const dark = root.dataset.theme === 'dark';
    scene.fog.color.set(dark ? 0x17191d : css('--sky-bottom', '#eef1f4'));
    sun.intensity = dark ? 1.1 : 2.6; sun.color.set(dark ? 0xc9d6ff : 0xfff3e2);
    hemi.intensity = dark ? .35 : .9;
    rockMat.color.setScalar(dark ? .62 : 1); backMat.color.setScalar(dark ? .5 : 1);
    const dot = css('--cloud-dot', '20 20 20').split(/\s+/).map(Number);
    cloudMat.uniforms.uColor.value.setRGB(dot[0] / 255, dot[1] / 255, dot[2] / 255, SRGBColorSpace);
    cloudMat.blending = dark ? AdditiveBlending : NormalBlending; cloudMat.needsUpdate = true;
  }
  new MutationObserver(applyTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  applyTheme();

  /* ---------- size, camera, summit tracking ---------- */
  let W = 0, Hh = 0;
  function resize() {
    W = hero.clientWidth; Hh = hero.clientHeight; if (!W || !Hh) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr); renderer.setSize(W, Hh, false);
    camera.aspect = W / Hh;
    // portrait screens: step back so the massif still fits
    camera.fov = camera.aspect < 1 ? 46 : 32;
    camera.updateProjectionMatrix();
    cloudMat.uniforms.uPx.value = dpr * Hh / 520;
  }
  resize(); addEventListener('resize', resize);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  const tmp = new Vector3(); let lastPeak = -1;
  // where the summit should sit, as a fraction of the hero height from the bottom
  const SUMMIT_AT = () => (camera.aspect < 1 ? .45 : .43);
  function placeCamera(t) {
    const sway = reduced.matches ? 0 : Math.sin(t * .07) * .08;
    mouse.x += (mouse.tx - mouse.x) * .04; mouse.y += (mouse.ty - mouse.y) * .04;
    const portrait = camera.aspect < 1;
    const dist = portrait ? 5.2 : 3.5;
    const ang = sway + (reduced.matches ? 0 : mouse.x * .07);
    camera.position.set(Math.sin(ang) * dist, (portrait ? .7 : .55) + (reduced.matches ? 0 : -mouse.y * .04), Math.cos(ang) * dist);
    // aim so the summit lands at SUMMIT_AT: a few secant steps on the look-at height
    let ly = .5;
    const at = (y) => { camera.lookAt(0, y, 0); camera.updateMatrixWorld(); return (tmp.copy(summit).project(camera).y + 1) / 2; };
    for (let i = 0, f0 = at(ly) - SUMMIT_AT(); i < 3 && Math.abs(f0) > .002; i++) {
      const f1 = at(ly + .05) - SUMMIT_AT(); const d = (f1 - f0) / .05; if (!d) break;
      ly -= f0 / d; f0 = at(ly) - SUMMIT_AT();
    }
    const peak = Math.round(((tmp.copy(summit).project(camera).y + 1) / 2) * Hh);
    if (Math.abs(peak - lastPeak) >= 1) { hero.style.setProperty('--peak', `${peak}px`); lastPeak = peak; }
  }

  /* ---------- loop ---------- */
  let visible = true, t0 = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); root.classList.remove('webgl-hero'); canvas.remove(); dispatchEvent(new Event('resize'));
  });
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || !root.classList.contains('webgl-hero')) return;
    const t = (now - t0) / 1000;
    const p = clamp(scrollY / (Hh * .85), 0, 1);
    placeCamera(t);
    cloudMat.uniforms.uP.value = p; cloudMat.uniforms.uTime.value = reduced.matches ? 0 : t;
    const solid = 1 - clamp((p - .04) / .3, 0, 1);
    rockMat.opacity = solid; backMat.opacity = solid; massif.visible = back.visible = solid > .001;
    rockMat.depthWrite = solid > .98;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
})();
