// Shared runtime for all pages: header/footer, theme toggle, mobile menu,
// sticky header, scroll reveal, and the blog renderers. Mirrors the roles of
// Header.astro, Footer.astro, ToggleTheme.astro, ToggleMenu.astro, Intersect.astro
// and the [...blog] routes from the original Astro project.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const POSTS = (window.POSTS || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const PAGE_SIZE = 4;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = d => new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(d + 'T00:00:00'));
  const readingTime = html => Math.max(1, Math.round(html.replace(/<[^>]+>/g, ' ').split(/\s+/).length / 120));

  const ICON = {
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
    sun: '<svg class="theme-icon-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg class="theme-icon-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
    menu: '<svg class="open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg><svg class="close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    rss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/></svg>',
  };

  const NAV = [
    { text: '홈 데모', links: [['SaaS', 'index.html#features'], ['Startup', 'index.html#steps'], ['Personal', 'index.html#content']] },
    { text: '페이지', links: [['Features', 'index.html#features'], ['Stats', 'index.html#stats'], ['FAQ', 'index.html#faq']] },
    { text: '블로그', links: [['전체 글', 'blog.html'], ['카테고리: tutorials', 'blog.html?category=tutorials'], ['태그: css', 'blog.html?tag=css'], ['글 상세 예시', 'post.html?slug=' + (POSTS[0]?.slug || '')]] },
    { text: 'FAQ', href: 'index.html#faq' },
  ];
  const FOOTER = [
    ['제품', ['Features', 'Security', 'Team', 'Enterprise', 'Pricing']],
    ['플랫폼', ['Developer API', 'Partners', 'Atom', 'Electron']],
    ['지원', ['Docs', 'Community Forum', 'Professional Services', 'Status']],
    ['회사', ['About', 'Blog', 'Careers', 'Press']],
  ];

  /* ---------- theme (head script already applied the initial class) ---------- */
  const root = document.documentElement;
  function setTheme(mode) {
    root.classList.toggle('dark', mode === 'dark');
    try { localStorage.setItem('theme', mode); } catch (_) { /* storage blocked */ }
  }

  /* ---------- header & footer ---------- */
  function renderHeader() {
    const host = $('[data-site-header]');
    if (!host) return;
    const items = NAV.map(n => n.links
      ? `<li class="nav-item"><button class="nav-link" aria-haspopup="true">${n.text}${ICON.chevron}</button>
           <ul class="dropdown">${n.links.map(([t, h]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></li>`
      : `<li class="nav-item"><a class="nav-link" href="${n.href}">${n.text}</a></li>`).join('');
    const mobile = NAV.map(n => n.links
      ? `<li class="group-title">${n.text}</li>${n.links.map(([t, h]) => `<li><a href="${h}">${t}</a></li>`).join('')}`
      : `<li><a href="${n.href}"><strong>${n.text}</strong></a></li>`).join('');
    host.className = 'site-header';
    host.innerHTML = `
      <div class="container header-inner">
        <a class="logo" href="index.html"><span class="logo-mark" aria-hidden="true"></span>Skyline</a>
        <nav class="main-nav" aria-label="Main"><ul>${items}</ul></nav>
        <div class="header-actions">
          <button class="icon-btn" data-aw-toggle-color-scheme aria-label="Toggle between dark and light mode">${ICON.sun}${ICON.moon}</button>
          <a class="icon-btn" href="blog.html" aria-label="Blog feed">${ICON.rss}</a>
          <a class="btn btn-primary header-cta" href="#">시작하기</a>
          <button class="icon-btn burger" data-aw-toggle-menu aria-label="Toggle menu" aria-expanded="false">${ICON.menu}</button>
        </div>
      </div>
      <nav class="mobile-menu" aria-label="Mobile"><ul>${mobile}</ul><div class="container"><a class="btn btn-primary" href="#">시작하기</a></div></nav>`;

    $('[data-aw-toggle-color-scheme]').addEventListener('click', () =>
      setTheme(root.classList.contains('dark') ? 'light' : 'dark'));
    const burger = $('[data-aw-toggle-menu]');
    burger.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
    }));
    // sticky header turns opaque once the page scrolls (Header.astro `isSticky`)
    const onScroll = () => host.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function renderFooter() {
    const host = $('[data-site-footer]');
    if (!host) return;
    host.className = 'site-footer';
    host.innerHTML = `
      <div class="container footer-grid">
        <div class="footer-brand"><a class="logo" href="index.html"><span class="logo-mark" aria-hidden="true"></span>Skyline</a>
          <p>AstroWind 구조를 역설계해 의존성 없이 다시 구현한 랜딩·블로그 데모입니다.</p></div>
        ${FOOTER.map(([h, links]) => `<div class="footer-col"><h4>${h}</h4><ul>${links.map(l => `<li><a href="#">${l}</a></li>`).join('')}</ul></div>`).join('')}
      </div>
      <div class="container footer-bottom"><span>© ${new Date().getFullYear()} Skyline demo · MIT-licensed structure study</span>
        <span><a href="#">Terms</a> · <a href="#">Privacy</a></span></div>`;
  }

  /* ---------- blog renderers ---------- */
  const card = p => `
    <a class="post-card reveal" href="post.html?slug=${encodeURIComponent(p.slug)}">
      <div class="post-thumb" style="--h:${p.hue}" role="img" aria-label=""></div>
      <div class="post-meta"><time datetime="${p.date}">${fmtDate(p.date)}</time><span>· ${readingTime(p.body)}분</span></div>
      <h3>${esc(p.title)}</h3><p class="muted">${esc(p.excerpt)}</p>
    </a>`;

  function renderLatest() {
    const host = $('[data-latest-posts]');
    if (host) host.innerHTML = POSTS.slice(0, 3).map(card).join('');
  }

  function renderBlogList() {
    const host = $('[data-blog-list]');
    if (!host) return;
    const q = new URLSearchParams(location.search);
    const category = q.get('category'), tag = q.get('tag');
    const filtered = POSTS.filter(p => (!category || p.category === category) && (!tag || p.tags.includes(tag)));
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const page = Math.min(pages, Math.max(1, parseInt(q.get('page') || '1', 10) || 1));
    const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    $('[data-blog-title]').textContent = category ? `카테고리: ${category}` : tag ? `태그: #${tag}` : '블로그';
    document.title = `${$('[data-blog-title]').textContent} — Skyline`;
    const cats = [...new Set(POSTS.map(p => p.category))];
    const tags = [...new Set(POSTS.flatMap(p => p.tags))].sort();
    $('[data-blog-filters]').innerHTML =
      `<a class="chip" href="blog.html" aria-current="${!category && !tag}">전체</a>` +
      cats.map(c => `<a class="chip" href="blog.html?category=${c}" aria-current="${c === category}">${c}</a>`).join('') +
      tags.map(t => `<a class="chip" href="blog.html?tag=${t}" aria-current="${t === tag}">#${t}</a>`).join('');

    host.innerHTML = slice.length ? slice.map(p => `
      <li class="post-row reveal">
        <a href="post.html?slug=${encodeURIComponent(p.slug)}" tabindex="-1" aria-hidden="true"><div class="post-thumb" style="--h:${p.hue}"></div></a>
        <div>
          <div class="post-meta"><time datetime="${p.date}">${fmtDate(p.date)}</time><span>· <a href="blog.html?category=${p.category}">${p.category}</a></span><span>· ${readingTime(p.body)}분</span></div>
          <h2><a href="post.html?slug=${encodeURIComponent(p.slug)}">${esc(p.title)}</a></h2>
          <p class="muted">${esc(p.excerpt)}</p>
          <div class="tags">${p.tags.map(t => `<a class="tag" href="blog.html?tag=${t}">#${t}</a>`).join('')}</div>
        </div>
      </li>`).join('') : '<li class="empty">해당하는 글이 없습니다.</li>';

    const link = n => { const u = new URLSearchParams(q); u.set('page', n); return 'blog.html?' + u; };
    $('[data-pagination]').innerHTML = pages > 1 ? `
      <a class="btn" href="${link(page - 1)}" aria-disabled="${page === 1}">← 이전</a>
      <span class="muted">${page} / ${pages}</span>
      <a class="btn" href="${link(page + 1)}" aria-disabled="${page === pages}">다음 →</a>` : '';
  }

  function renderPost() {
    const host = $('[data-post]');
    if (!host) return;
    const slug = new URLSearchParams(location.search).get('slug');
    const p = POSTS.find(x => x.slug === slug);
    if (!p) {
      host.innerHTML = `<header><h1>글을 찾을 수 없습니다</h1><p class="muted">주소를 확인하거나 <a href="blog.html">블로그 목록</a>으로 돌아가세요.</p></header>`;
      return;
    }
    document.title = `${p.title} — Skyline`;
    const idx = POSTS.indexOf(p);
    const related = POSTS.filter(x => x !== p && x.tags.some(t => p.tags.includes(t))).slice(0, 3);
    host.innerHTML = `
      <header class="container narrow">
        <div class="post-meta" style="justify-content:center"><time datetime="${p.date}">${fmtDate(p.date)}</time><span>· <a href="blog.html?category=${p.category}">${p.category}</a></span><span>· ${readingTime(p.body)}분 읽기</span></div>
        <h1>${esc(p.title)}</h1><p class="muted" style="font-size:19px">${esc(p.excerpt)}</p>
      </header>
      <div class="container"><div class="post-thumb" style="--h:${p.hue}"></div></div>
      <div class="container narrow">
        <div class="prose">${p.body}</div>
        <div class="tags">${p.tags.map(t => `<a class="tag" href="blog.html?tag=${t}">#${t}</a>`).join('')}</div>
        <div class="share">
          <a class="link-arrow" href="blog.html">← 블로그로 돌아가기</a>
          <span><button class="btn" data-copy-link>링크 복사</button> <span class="copy-status" data-copy-status role="status"></span></span>
        </div>
        <div class="share" style="border:0;margin-top:16px;padding:0">
          ${POSTS[idx + 1] ? `<a class="link-arrow" href="post.html?slug=${POSTS[idx + 1].slug}">← ${esc(POSTS[idx + 1].title)}</a>` : '<span></span>'}
          ${POSTS[idx - 1] ? `<a class="link-arrow" href="post.html?slug=${POSTS[idx - 1].slug}">${esc(POSTS[idx - 1].title)} →</a>` : ''}
        </div>
      </div>
      ${related.length ? `<section class="section"><div class="container"><div class="row-head"><h2>관련 글</h2></div><div class="card-grid">${related.map(card).join('')}</div></div></section>` : ''}`;
    $('[data-copy-link]').addEventListener('click', async () => {
      const status = $('[data-copy-status]');
      try { await navigator.clipboard.writeText(location.href); status.textContent = '복사됨'; }
      catch (_) { status.textContent = '복사할 수 없습니다'; }
    });
  }

  /* ---------- stats count-up + reveal ---------- */
  function animateStats() {
    $$('[data-count]').forEach(el => {
      const target = +el.dataset.count, suffix = el.dataset.suffix || '';
      el.textContent = target.toLocaleString() + suffix;
      el.dataset.final = el.textContent;
    });
  }
  function reveal() {
    const els = $$('.reveal');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(e => e.classList.add('in')); return; }
    // content stays visible if this script never runs: hiding is opt-in
    document.documentElement.classList.add('reveal-ready');
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      const num = en.target.querySelector('[data-count]');
      if (num) countUp(num);
      io.unobserve(en.target);
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
  }
  function countUp(el) {
    const target = +el.dataset.count, suffix = el.dataset.suffix || '', t0 = performance.now();
    const tick = now => {
      const k = Math.min(1, (now - t0) / 900);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))).toLocaleString() + suffix;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  renderHeader();
  renderFooter();
  renderLatest();
  renderBlogList();
  renderPost();
  animateStats();
  reveal();
})();
