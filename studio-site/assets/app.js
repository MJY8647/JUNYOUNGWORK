/* Studio site runtime — no dependencies.
   Sections: helpers · logo · render · gate · scramble · nav/menu/theme ·
   hero mountain + orbit · manifesto pen marks + point cloud + logo wall ·
   3D gallery · portals · dialogs/enquiry · newsletter · reveal */
(() => {
  'use strict';
  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad2 = (n) => String(n).padStart(2, '0');

  /* ---------------- logo: original monogram (ring + 4-point star) ---------------- */
  const LOGO = `<svg viewBox="0 0 40 34" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M20 0C31 0 40 7.6 40 17S31 34 20 34 0 26.4 0 17 9 0 20 0Zm0 7.5c-.9 4.6-3.6 7.4-8.2 9.5 4.6 2.1 7.3 4.9 8.2 9.5.9-4.6 3.6-7.4 8.2-9.5-4.6-2.1-7.3-4.9-8.2-9.5Z"/></svg>`;
  $$('[data-logo]').forEach((el) => { el.innerHTML = LOGO; });

  /* ---------------- pen-mark builders ---------------- */
  const pen = {
    underline: (inner, delay = .3) => `<span class="pen pen--underline" style="--pen-delay:${delay}s">${inner}<svg viewBox="0 0 100 10" preserveAspectRatio="none"><path pathLength="1" d="M2 6 C 25 2, 55 9, 98 4 M10 8 C 40 5, 70 7, 92 6"/></svg></span>`,
    ring: (inner, delay = .3) => `<span class="pen pen--ring" style="--pen-delay:${delay}s">${inner}<svg viewBox="0 0 100 50" preserveAspectRatio="none"><path pathLength="1" d="M60 6 C 20 2, 2 14, 4 27 C 6 42, 40 48, 70 44 C 96 40, 100 22, 86 12 C 74 4, 44 3, 24 9"/></svg></span>`,
    box: (inner) => `<span class="pen pen--box">${inner}<svg viewBox="0 0 100 40" preserveAspectRatio="none"><rect pathLength="1" x="0" y="0" width="100" height="40"/></svg><i class="handle handle--tl"></i><i class="handle handle--tr"></i><i class="handle handle--bl"></i><i class="handle handle--br"></i></span>`,
  };

  /* ---------------- render content ---------------- */
  function render() {
    document.title = `${S.brand.name} — ${S.hero.eyebrow}`;
    // hero
    $('[data-hero-eyebrow]').textContent = S.hero.eyebrow;
    const after = S.hero.after.map((w, i) => `<span>${i === S.hero.mark ? pen.underline(esc(w), 1.2) : esc(w)}</span>`).join(' ');
    $('[data-hero-title]').innerHTML = `<span class="reveal-line"><span>${esc(S.hero.before)}</span></span>
      <span class="sep" aria-hidden="true">✦</span><span class="reveal-line">${after.replace(/<span>/g, '<span>')}</span>`;
    $('[data-hero-cover]').innerHTML = Array.from({ length: 4 }, () => `<span class="hero__cover-word">${esc(S.brand.short.toLowerCase())}</span>`).join('') + '<span class="hero__cover-mark">✱</span>';

    // manifesto
    // hand-written notes are anchored to their words so they stay attached at every width
    const note = `<span class="hand manifesto__note" aria-hidden="true">${esc(S.manifesto.note)}</span>`;
    const pointer = `<span class="manifesto__pointer" aria-hidden="true"><span class="hand">${esc(S.manifesto.pointer)}</span>
        <svg viewBox="0 0 26 40"><path pathLength="1" d="M8 2 C 16 10, 18 22, 13 36 M7 29 L13 37 L19 30"/></svg></span>`;
    let first = true;
    const words = S.manifesto.words.map(([t, style]) => {
      if (style === 'br') return '<span class="br"></span>';
      if (style === 'emoji') return `<span class="t-emoji" aria-hidden="true">${t}</span>`;
      let inner = `<span class="${style.includes('slant') ? 't-slant' : 't-sans'}">${esc(t)}</span>`;
      if (style.includes('ring')) inner = pen.ring(inner, .2);
      if (style.includes('underline')) inner = pen.underline(inner, .6);
      if (style.includes('box')) inner = pen.box(inner);
      const extra = (first ? note : '') + (style.includes('box') ? pointer : '');
      first = false;
      return extra ? `<span class="anchor">${inner}${extra}</span>` : inner;
    }).join('');
    $('[data-manifesto-text]').innerHTML = `<span class="visually-hidden">${esc(S.manifesto.note)} </span>${words}`;

    // work
    $('[data-work-title]').textContent = S.work.label;
    $('[data-work-side-l]').innerHTML = `SELECTED WORK<br>${S.work.projects.length} PROJECTS<br>${esc(S.work.since)}`;
    $('[data-ring]').innerHTML = S.work.projects.map((p, i) => `
      <button class="card" role="option" aria-selected="${i === 0}" data-card="${i}" style="--h:${p.hue}" aria-label="${esc(p.client)} — ${esc(p.title)}">
        <span class="card__tab mono">${esc(p.category)}</span>
        <span class="card__art"><span class="card__word">${esc(p.word)}</span></span>
        <span class="card__title" style="display:block">${esc(p.title)}</span>
        <span class="card__foot"><span class="card__client">${esc(p.client)}</span><span class="card__services mono">${esc(p.services)}</span></span>
      </button>`).join('');

    // portals
    const fx = {
      awards: `<span class="fx-plaque"><b>✦</b></span><span class="fx-sparkle" style="left:18%;top:30%">✦</span><span class="fx-sparkle" style="right:16%;top:62%;animation-delay:-1s">✦</span><span class="fx-sparkle" style="left:30%;bottom:16%;animation-delay:-1.8s">✦</span>`,
      about: `<span class="fx-rings"><i></i><i></i><b>${LOGO}</b></span>`,
      services: `<svg class="fx-star" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#777" stop-opacity=".4"/></linearGradient></defs><path fill="url(#g)" d="M50 0 C55 35 65 45 100 50 C65 55 55 65 50 100 C45 65 35 55 0 50 C35 45 45 35 50 0Z"/></svg>`,
    };
    $('[data-portals]').innerHTML = S.portals.map((p) => `
      <a class="portal portal--${p.kind} grain" href="#contact">
        <span class="portal__title">${esc(p.title)}</span>
        <span class="portal__fx" aria-hidden="true">${fx[p.kind] || ''}</span>
        <span class="portal__open mono">OPEN <small>${esc(p.body)}</small></span>
      </a>`).join('');

    // contact
    $('[data-contact-title]').innerHTML = S.contact.lines.map((l, i) => `<span>${i === S.contact.mark ? pen.underline(esc(l), .5) : esc(l)}</span>`).join('');
    $('[data-contact-cta]').textContent = S.contact.cta;

    // menu
    const anchors = ['#top', '#work', '#about', '#about', '#about', '#contact'];
    $('[data-menu-pages]').innerHTML = S.menu.pages.map((p, i) => `<li><a href="${anchors[i] || '#top'}" ${i === 0 ? 'aria-current="page"' : ''} data-menu-link>${esc(p)}</a></li>`).join('');
    $('[data-menu-services]').innerHTML = S.menu.services.map(([n, d]) => `<li><strong>${esc(n)}</strong><span class="mono">${esc(d)}</span></li>`).join('');
    $$('[data-socials]').forEach((ul) => { ul.innerHTML = S.footer.socials.map(([n, h, short]) => `<li><a href="${esc(h)}" aria-label="${esc(n)}">${esc(short || n.slice(0, 2))}</a></li>`).join(''); });

    // footer
    $('[data-footer-tagline]').innerHTML = S.footer.tagline.map((t, i) => i === 1 ? pen.underline(esc(t), .2) : esc(t)).join('<br>');
    const news = S.footer.news.map((n) => `<a href="#work">${esc(n)}</a>`).join('');
    $('[data-ticker]').innerHTML = news + news + news + news; // duplicated for the seamless -50% loop
    $$('[data-ticker] a').slice(S.footer.news.length).forEach((a) => a.setAttribute('aria-hidden', 'true'));
    $('[data-footer-pages]').innerHTML = S.menu.pages.map((p, i) => `<li><a href="${anchors[i] || '#top'}">${esc(p)}</a></li>`).join('');
    $('[data-copyright]').textContent = `© ${S.brand.founded}–${new Date().getFullYear()} ${S.brand.name}`;
    $('[data-city]').textContent = S.brand.city;
    $('[data-coords]').textContent = S.brand.coords;
    const mail = $('[data-email]'); mail.textContent = S.brand.email; mail.href = `mailto:${S.brand.email}`;

    // enquiry options
    $('[data-intents]').innerHTML = S.enquiry.intents.map(([t, d], i) => `<button type="button" class="intent" role="radio" aria-checked="${i === 0}" data-intent="${esc(t)}"><span>${esc(t)}</span><small>${esc(d)}</small></button>`).join('');
    $('[data-service-chips]').innerHTML = S.enquiry.services.map((s) => `<button type="button" class="chip" aria-pressed="false" data-chip="${esc(s)}">${esc(s)}</button>`).join('');
  }

  /* ---------------- text scramble (hover on nav labels, logo wall) ---------------- */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+';
  function scramble(el, to, dur = 600) {
    if (reduced.matches) { el.textContent = to; return; }
    const from = el.textContent; const len = Math.max(from.length, to.length); const t0 = performance.now();
    cancelAnimationFrame(el._scr);
    const tick = (now) => {
      const k = clamp((now - t0) / dur, 0, 1); let out = '';
      for (let i = 0; i < len; i++) {
        const settle = i / len;
        out += k > settle * .7 + .3 ? (to[i] || '') : (to[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]);
      }
      el.textContent = out;
      if (k < 1) el._scr = requestAnimationFrame(tick); else el.textContent = to;
    };
    el._scr = requestAnimationFrame(tick);
  }
  function bindScrambleHover() {
    $$('[data-scramble]').forEach((el) => {
      const text = el.textContent;
      el.closest('button, a').addEventListener('pointerenter', () => scramble(el, text, 450));
    });
  }

  /* ---------------- gate (loader) ---------------- */
  function gate() {
    const count = $('[data-gate-count]');
    const minMs = reduced.matches ? 0 : 900; const t0 = performance.now();
    let ready = false;
    const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(() => { ready = true; });
    const tick = (now) => {
      const k = clamp((now - t0) / Math.max(minMs, 1), 0, 1);
      const shown = Math.round((ready ? k : Math.min(k, .9)) * 100);
      count.textContent = shown;
      if (shown >= 100) { root.classList.remove('is-loading'); $('[data-hero]').classList.add('is-in'); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------------- nav: hide on scroll down, menu, theme ---------------- */
  function nav() {
    const bar = $('.site-nav'); let lastY = scrollY;
    addEventListener('scroll', () => {
      const y = scrollY;
      if (y > lastY + 4 && y > 300 && $('[data-menu]').hidden) bar.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 300) bar.classList.remove('is-hidden');
      lastY = y;
    }, { passive: true });

    const menu = $('[data-menu]'); const openBtn = $('[data-menu-open]');
    const open = () => { menu.hidden = false; openBtn.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; $('[data-menu-close].chip-btn', menu).focus(); };
    const close = () => { menu.hidden = true; openBtn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; openBtn.focus({ preventScroll: true }); };
    openBtn.addEventListener('click', open);
    $$('[data-menu-close]', menu).forEach((b) => b.addEventListener('click', close));
    $$('[data-menu-link]', menu).forEach((a) => a.addEventListener('click', () => { menu.hidden = true; openBtn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }));
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { // focus trap
        const f = $$('button, a[href]', $('.menu__card', menu)); const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // theme: System / Light / Dark
    const dark = matchMedia('(prefers-color-scheme: dark)');
    const apply = (mode) => {
      root.dataset.themeMode = mode;
      root.dataset.theme = mode === 'dark' || (mode === 'system' && dark.matches) ? 'dark' : 'light';
      $$('[data-theme-set]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.themeSet === mode)));
      $('meta[name="theme-color"]').content = root.dataset.theme === 'dark' ? '#0e0e0f' : '#f9f9f9';
      drawMountain(); // canvas colours follow the theme
    };
    $$('[data-theme-set]').forEach((b) => b.addEventListener('click', () => {
      try { localStorage.setItem('theme-mode', b.dataset.themeSet); } catch (e) { /* storage blocked */ }
      apply(b.dataset.themeSet);
    }));
    dark.addEventListener('change', () => root.dataset.themeMode === 'system' && apply('system'));
    apply(root.dataset.themeMode || 'system');
  }

  /* ---------------- noise ---------------- */
  function makeNoise(seed = 7) {
    const p = new Uint8Array(512); let s = seed;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const perm = Array.from({ length: 256 }, (_, i) => i).sort(() => rnd() - .5);
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const grad = (h, x, y) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
    const n2 = (x, y) => {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
      const u = fade(x), v = fade(y), a = p[X] + Y, b = p[X + 1] + Y;
      const l1 = grad(p[a], x, y) + u * (grad(p[b], x - 1, y) - grad(p[a], x, y));
      const l2 = grad(p[a + 1], x, y - 1) + u * (grad(p[b + 1], x - 1, y - 1) - grad(p[a + 1], x, y - 1));
      return l1 + v * (l2 - l1);
    };
    return (x, y, oct = 5) => { let f = 1, a = 1, sum = 0, norm = 0; for (let i = 0; i < oct; i++) { sum += a * n2(x * f, y * f); norm += a; f *= 2; a *= .5; } return sum / norm; };
  }
  const noise = makeNoise(11);
  // shared terrain height: a ridge-noise massif centred at x=0
  const height = (x, z) => {
    const r = Math.sqrt(x * x * .9 + z * z * 1.6);
    const base = Math.exp(-r * r * 2.2);
    const ridge = 1 - Math.abs(noise(x * 2.2 + 3, z * 2.2 + 1, 5));
    return base * (.7 + .5 * ridge * ridge) + noise(x * 5, z * 5, 3) * .04 * base;
  };

  /* ---------------- hero: shaded mountain on canvas ---------------- */
  const mountainCanvas = $('[data-mountain]');
  function drawMountain() {
    const c = mountainCanvas; if (!c) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = c.clientWidth, h = c.clientHeight; if (!w || !h) return;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const darkTheme = root.dataset.theme === 'dark';
    const span = clamp(w / (h * 2.4), .55, 1.05);       // wider screens show a broader massif
    const amp = Math.min(.66, (w / h) * .45);            // keep the massif from looking spiky on tall screens
    const silhouette = (x) => (height(x * span, 0) * .92 + height(x * span * .9, .25) * .12) * amp;
    // publish the summit height so the cover can stand exactly on the peak
    let peak = 0; for (let px = w * .4; px <= w * .6; px += 4) peak = Math.max(peak, silhouette(px / w * 2 - 1));
    c.parentElement.style.setProperty('--peak', `${Math.round(peak * h * .98)}px`);
    // back range (lighter, hazier)
    g.beginPath(); g.moveTo(0, h);
    for (let px = 0; px <= w; px += 2) { const x = px / w * 2 - 1; g.lineTo(px, h - (height(x * span * 1.6 + .9, .6) * .55 + .06) * h); }
    g.lineTo(w, h); g.closePath();
    g.fillStyle = darkTheme ? 'rgba(80,90,105,.55)' : 'rgba(150,160,172,.55)'; g.fill();
    // main massif with vertical rock gradient
    const peakY = (px) => h - silhouette(px / w * 2 - 1) * h * .98;
    g.beginPath(); g.moveTo(0, h);
    for (let px = 0; px <= w; px += 2) g.lineTo(px, peakY(px));
    g.lineTo(w, h); g.closePath();
    const grd = g.createLinearGradient(0, h * .1, 0, h);
    grd.addColorStop(0, darkTheme ? '#6c6f75' : '#8d9096'); grd.addColorStop(.5, darkTheme ? '#3a3c40' : '#5d6066'); grd.addColorStop(1, darkTheme ? '#1b1c1e' : '#c9ccd1');
    g.fillStyle = grd; g.fill();
    // rock striations + snow: short strokes following the downhill slope, clipped to the massif
    g.save(); g.clip();
    for (let i = 0; i < 1500; i++) {
      const px = Math.random() * w; const top = peakY(px); const py = top + Math.random() * (h - top) * .75;
      const x = px / w * 2 - 1; const slope = (silhouette(x + .004) - silhouette(x - .004)) / .008;
      const n = noise(px * .012, py * .02, 3);
      const len = (6 + Math.random() * 18) * Math.min(1, w / 900 + .35); const dir = -Math.sign(slope) || 1;
      const snow = n > .08 && (py - top) < (h - top) * .45;
      g.strokeStyle = snow ? `rgba(245,247,250,${.25 + Math.random() * .35})` : `rgba(30,32,36,${.05 + Math.random() * .08})`;
      g.lineWidth = snow ? 1.2 : 1;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px + dir * len * .55, py + len); g.stroke();
    }
    // mist at the base
    const mist = g.createLinearGradient(0, h * .55, 0, h);
    mist.addColorStop(0, 'rgba(0,0,0,0)'); mist.addColorStop(1, getComputedStyle(root).getPropertyValue('--bg').trim() || '#f9f9f9');
    g.fillStyle = mist; g.fillRect(0, 0, w, h);
    g.restore();
  }

  /* hero orbit star + scroll parallax */
  function heroMotion() {
    const star = $('[data-orbit-star]'); const stage = $('.hero__stage'); const cover = $('[data-hero-cover]'); const hero = $('[data-hero]');
    let t = 0; let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
    const loop = () => {
      if (visible) {
        const W = stage.clientWidth, H = stage.clientHeight;
        if (!reduced.matches) t += .0035;
        // ellipse matches the SVG: 210% wide, 85% tall, rotated -12deg, centred on the stage
        const a = W * 2.1 * .4875, b = H * .85 * .4667, ang = -12 * Math.PI / 180;
        const ex = Math.cos(t * Math.PI * 2) * a, ey = Math.sin(t * Math.PI * 2) * b;
        const x = W / 2 + ex * Math.cos(ang) - ey * Math.sin(ang);
        const y = H * .425 + ex * Math.sin(ang) + ey * Math.cos(ang);
        star.style.transform = `translate(${x - 9}px, ${y - 9}px)`;
        star.style.zIndex = Math.sin(t * Math.PI * 2) > 0 ? 2 : 0;
        const p = clamp(scrollY / innerHeight, 0, 1);
        if (!reduced.matches) cover.style.transform = `translateY(${p * -60}px) rotateX(${p * 14}deg)`;
        mountainCanvas.style.transform = `translateY(${p * 40}px)`;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------------- manifesto: point cloud of the same terrain ---------------- */
  function pointCloud() {
    const c = $('[data-cloud]'); if (!c) return;
    const pts = [];
    for (let i = 0; i < 5200; i++) {
      const x = (Math.random() * 2 - 1) * 1.6, z = (Math.random() * 2 - 1) * 1.2;
      const y = height(x, z);
      if (y < .03 && Math.random() > .25) continue;
      pts.push([x, y, z, Math.random()]);
    }
    let w = 0, h = 0, dpr = 1, rot = 0, visible = false, progress = 0;
    const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; };
    resize(); addEventListener('resize', resize);
    const sec = $('[data-manifesto]');
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(sec);
    const g = c.getContext('2d');
    const draw = () => {
      if (visible) {
        const r = sec.getBoundingClientRect();
        progress = clamp(1 - (r.top + r.height * .3) / innerHeight, 0, 1); // 0 when entering → 1 in place
        if (!reduced.matches) rot += .0016;
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
        const col = getComputedStyle(root).getPropertyValue('--cloud-dot').trim() || '20 20 20';
        const cos = Math.cos(rot), sin = Math.sin(rot);
        const camY = .95, camZ = 2.7, f = Math.min(w, h * 1.3) * .8;
        for (const [x, y, z, s] of pts) {
          const rx = x * cos - z * sin, rz = x * sin + z * cos;
          const assemble = clamp(progress * 1.6 - s * .6, 0, 1); // points settle in staggered
          const yy = y * assemble - (1 - assemble) * .6;
          const dz = rz + camZ; if (dz < .2) continue;
          const sx = w / 2 + (rx / dz) * f; const sy = h * (w > 768 ? .4 : .5) - ((yy - camY) / dz) * f;
          const a = clamp(.95 - (dz - 1.6) * .38, .14, .9) * assemble;
          g.fillStyle = `rgb(${col.replace(/ /g, ',')},${a})`;
          g.fillRect(sx, sy, 1.4, 1.4);
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  /* ---------------- logo wall: cycle names with scramble ---------------- */
  function logoWall() {
    const wall = $('[data-logowall]'); const names = S.manifesto.clients; const slots = 4;
    wall.innerHTML = names.slice(0, slots).map((n) => `<span>${esc(n)}</span>`).join('');
    let next = slots;
    if (reduced.matches || names.length <= slots) return;
    setInterval(() => {
      if (document.hidden) return;
      const el = wall.children[next % slots]; scramble(el, names[next % names.length], 700); next++;
    }, 1600);
  }

  /* ---------------- 3D curved gallery ---------------- */
  function gallery() {
    const stage = $('[data-gallery]'); const cards = $$('[data-card]'); const N = cards.length;
    const count = $('[data-work-count]'); const year = $('[data-work-year]'); const bubble = $('[data-drag-bubble]');
    let pos = 0, target = 0, vel = 0, dragging = false, startX = 0, startPos = 0, lastX = 0, lastT = 0, moved = 0;
    const STEP = 21; // degrees between cards
    const mod = (i) => ((i % N) + N) % N;
    const layout = () => {
      const cw = cards[0].offsetWidth; const R = (cw / 2 + 18) / Math.tan((STEP / 2) * Math.PI / 180);
      cards.forEach((card, i) => {
        const d = (((i - pos) % N) + N * 1.5) % N - N / 2; // shortest signed distance on the loop
        const a = d * STEP; const abs = Math.abs(a);
        card.style.transform = `translateZ(${-R}px) rotateY(${a}deg) translateZ(${R}px)`;
        card.style.visibility = abs > 95 ? 'hidden' : 'visible';
        card.style.zIndex = String(100 - Math.round(abs));
        card.style.opacity = abs > 60 ? String(clamp(1 - (abs - 60) / 35, 0, 1)) : '';
      });
      const idx = ((Math.round(pos) % N) + N) % N;
      if (layout.idx !== idx) {
        layout.idx = idx;
        cards.forEach((c, i) => c.setAttribute('aria-selected', String(i === idx)));
        count.textContent = `${pad2(idx + 1)} / ${pad2(N)}`;
        year.textContent = S.work.projects[idx].year;
      }
    };
    const loop = () => {
      if (!dragging) {
        if (Math.abs(vel) > .0005) { target += vel; vel *= .9; if (Math.abs(vel) < .02) { target = Math.round(target); vel = 0; } }
        pos += (target - pos) * (reduced.matches ? 1 : .12);
        if (Math.abs(target - pos) < .0005) pos = target;
      }
      layout();
      requestAnimationFrame(loop);
    };
    const pxPerCard = () => cards[0].offsetWidth * .85;
    stage.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = true; moved = 0; startX = lastX = e.clientX; startPos = pos; lastT = performance.now(); vel = 0;
      stage.setPointerCapture(e.pointerId); stage.classList.add('is-dragging');
    });
    stage.addEventListener('pointermove', (e) => {
      if (finePointer.matches) { bubble.style.setProperty('--x', e.clientX + 'px'); bubble.style.setProperty('--y', e.clientY + 'px'); }
      if (!dragging) return;
      const dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
      pos = startPos - dx / pxPerCard();
      const now = performance.now(); const dt = Math.max(now - lastT, 1);
      vel = -((e.clientX - lastX) / pxPerCard()) * (16 / dt); lastX = e.clientX; lastT = now;
    });
    const end = (e) => {
      if (!dragging) return; dragging = false; stage.classList.remove('is-dragging');
      target = Math.round(pos + vel * 6); vel = 0;
      if (moved < 6) { // treat as click
        const card = e.target.closest && e.target.closest('[data-card]');
        if (card) { const i = +card.dataset.card; const cur = mod(Math.round(pos)); if (i === cur) openProject(i); else target = Math.round(pos) + ((((i - cur) % N) + N * 1.5) % N - N / 2); }
      }
    };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    stage.addEventListener('pointerenter', () => finePointer.matches && bubble.classList.add('is-on'));
    stage.addEventListener('pointerleave', () => bubble.classList.remove('is-on'));
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { target = Math.round(target) + 1; e.preventDefault(); }
      if (e.key === 'ArrowLeft') { target = Math.round(target) - 1; e.preventDefault(); }
      if (e.key === 'Enter' || e.key === ' ') { openProject(mod(Math.round(target))); e.preventDefault(); }
    });
    // horizontal wheel / trackpad swipe moves the gallery; vertical wheel keeps scrolling the page
    stage.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { target = target + e.deltaX / 300; e.preventDefault(); clearTimeout(stage._snap); stage._snap = setTimeout(() => { target = Math.round(target); }, 160); }
    }, { passive: false });
    $('[data-project-open]').addEventListener('click', () => openProject(mod(Math.round(target))));
    requestAnimationFrame(loop);
  }

  /* ---------------- dialogs ---------------- */
  function openDialog(d) { if (!d.open) d.showModal(); }
  function closeDialog(d) { if (d.open) d.close(); }
  function openProject(i) {
    const p = S.work.projects[i]; const d = $('[data-project-dialog]');
    $('[data-project-title]').textContent = p.title;
    $('[data-project-meta]').textContent = `${p.client} · ${p.category} · ${p.services} · ${p.year}`;
    const cover = $('[data-project-cover]'); cover.style.setProperty('--h', p.hue);
    cover.className = 'sheet__cover card__art'; cover.innerHTML = `<span class="card__word">${esc(p.word)}</span>`;
    openDialog(d);
  }
  function dialogs() {
    $$('dialog').forEach((d) => {
      $$('[data-dialog-close]', d).forEach((b) => b.addEventListener('click', () => closeDialog(d)));
      d.addEventListener('click', (e) => { if (e.target === d) closeDialog(d); }); // backdrop click
    });
    $$('[data-enquiry-open]').forEach((b) => b.addEventListener('click', () => {
      const menu = $('[data-menu]'); if (!menu.hidden) { menu.hidden = true; document.body.style.overflow = ''; }
      resetEnquiry(); openDialog($('[data-enquiry]'));
    }));
  }

  /* ---------------- enquiry: 3-step accordion ---------------- */
  let countdownTimer = null;
  function resetEnquiry() {
    const form = $('[data-enquiry-form]'); form.hidden = false; $('[data-enquiry-done]').hidden = true;
    clearInterval(countdownTimer); showStep(1);
  }
  function showStep(n) {
    $$('[data-step]').forEach((s) => {
      const k = +s.dataset.step;
      s.classList.toggle('is-open', k === n); s.classList.toggle('is-done', k < n);
    });
    const first = $(`[data-step="${n}"] input, [data-step="${n}"] button.intent, [data-step="${n}"] .chip`);
    first && setTimeout(() => first.focus(), 30);
    $('[data-enquiry-error]').textContent = '';
  }
  function validateStep(n) {
    const fields = $$(`[data-step="${n}"] input[required], [data-step="${n}"] textarea[required]`);
    let ok = true;
    fields.forEach((f) => { const valid = f.checkValidity(); f.setAttribute('aria-invalid', String(!valid)); if (!valid && ok) { f.focus(); ok = false; } });
    if (n === 3 && !$('.chip[aria-pressed="true"]')) { $('[data-enquiry-error]').textContent = '도움이 필요한 분야를 하나 이상 골라 주세요.'; return false; }
    if (!ok) $('[data-enquiry-error]').textContent = n === 1 ? '이름과 올바른 이메일을 입력해 주세요.' : '내용을 10자 이상 적어 주세요.';
    return ok;
  }
  function enquiry() {
    const form = $('[data-enquiry-form]'); let step = 1;
    $$('[data-next]', form).forEach((b) => b.addEventListener('click', () => { if (validateStep(step)) showStep(++step); }));
    $$('[data-back]', form).forEach((b) => b.addEventListener('click', () => showStep(--step)));
    const resetStep = () => { step = 1; };
    $$('[data-enquiry-open]').forEach((b) => b.addEventListener('click', resetStep));
    const intents = $$('[data-intent]');
    intents.forEach((b) => b.addEventListener('click', () => intents.forEach((x) => x.setAttribute('aria-checked', String(x === b)))));
    $('[data-intents]').addEventListener('keydown', (e) => {
      const i = intents.findIndex((x) => x.getAttribute('aria-checked') === 'true');
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return; e.preventDefault(); const n = intents[(i + d + intents.length) % intents.length]; n.click(); n.focus();
    });
    $$('[data-chip]').forEach((c) => c.addEventListener('click', () => c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'))));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateStep(3)) return;
      const fd = new FormData(form);
      const intent = $('[data-intent][aria-checked="true"]').dataset.intent;
      const services = $$('.chip[aria-pressed="true"]').map((c) => c.dataset.chip).join(', ');
      const body = `이름: ${fd.get('name')}\n이메일: ${fd.get('email')}\n회사: ${fd.get('company') || '-'}\n유형: ${intent}\n분야: ${services}\n\n${fd.get('message')}`;
      // No backend: hand off to the visitor's mail app. Replace with a form endpoint when available.
      const a = document.createElement('a');
      a.href = `mailto:${S.brand.email}?subject=${encodeURIComponent(`[${intent}] ${fd.get('name')}`)}&body=${encodeURIComponent(body)}`;
      a.click();
      form.hidden = true; $('[data-enquiry-done]').hidden = false; form.reset();
      $$('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
      let left = 10; const out = $('[data-countdown]'); out.textContent = left;
      clearInterval(countdownTimer);
      countdownTimer = setInterval(() => { out.textContent = --left; if (left <= 0) { clearInterval(countdownTimer); closeDialog($('[data-enquiry]')); } }, 1000);
    });
  }

  /* ---------------- newsletter ---------------- */
  function newsletter() {
    const f = $('[data-newsletter]'); const msg = $('[data-newsletter-msg]'); const input = $('input', f);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!input.checkValidity()) { msg.textContent = '올바른 이메일 주소를 입력해 주세요.'; input.focus(); return; }
      msg.textContent = '구독 신청이 접수됐어요. (데모: 실제 발송 서비스와 연결 필요)'; f.reset();
    });
  }

  /* ---------------- reveal on scroll ---------------- */
  function reveal() {
    const els = $$('.manifesto__text, .contact__title, .footer__tagline');
    els.forEach((el) => el.classList.add('reveal-target'));
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { threshold: .35 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------------- boot ---------------- */
  render();
  bindScrambleHover();
  nav();
  drawMountain();
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(drawMountain, 120); });
  heroMotion();
  pointCloud();
  logoWall();
  gallery();
  dialogs();
  enquiry();
  newsletter();
  reveal();
  gate();
})();
