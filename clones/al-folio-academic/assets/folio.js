// Runtime for the al-folio rebuild. Re-implements, without Jekyll:
//  - theme.js: 3-state theme setting (system → light → dark) persisted in localStorage
//  - jekyll-scholar: BibTeX → publication list grouped by year (parseBibtex below)
//  - bibsearch.js: debounced search synced with the URL hash, hiding empty year groups
//  - header/footer/back-to-top/progress-bar includes
(function (root) {
  'use strict';

  /* ================= BibTeX parser (pure, also used by the Node test) ================= */
  function parseBibtex(src) {
    const strings = Object.create(null);
    const entries = [];
    let i = 0;
    const n = src.length;
    const ws = () => { while (i < n && /\s/.test(src[i])) i++; };

    function readBraced() {           // assumes src[i] === '{'
      let depth = 0, start = i + 1;
      for (; i < n; i++) {
        if (src[i] === '\\') { i++; continue; }
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) { i++; return src.slice(start, i - 1); }
      }
      throw new Error('Unbalanced braces in BibTeX');
    }
    function readQuoted() {           // assumes src[i] === '"'
      let depth = 0, start = ++i;
      for (; i < n; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') depth--;
        else if (src[i] === '"' && depth === 0) { i++; return src.slice(start, i - 1); }
      }
      throw new Error('Unterminated quoted value in BibTeX');
    }
    function readValue() {            // value pieces joined with '#'
      let out = '';
      for (;;) {
        ws();
        if (src[i] === '{') out += readBraced();
        else if (src[i] === '"') out += readQuoted();
        else {
          const m = /^[\w.:-]+/.exec(src.slice(i));
          if (!m) break;
          i += m[0].length;
          out += m[0] in strings ? strings[m[0]] : m[0];
        }
        ws();
        if (src[i] === '#') { i++; continue; }
        break;
      }
      return out.replace(/\s+/g, ' ').trim();
    }

    while (i < n) {
      const at = src.indexOf('@', i);
      if (at < 0) break;
      i = at + 1;
      const typeMatch = /^(\w+)\s*[{(]/.exec(src.slice(i));
      if (!typeMatch) continue;
      const type = typeMatch[1].toLowerCase();
      i += typeMatch[0].length;
      if (type === 'comment' || type === 'preamble') { i = src.indexOf('\n@', i); if (i < 0) break; continue; }
      if (type === 'string') {
        ws();
        const name = /^[\w-]+/.exec(src.slice(i))[0];
        i += name.length; ws(); i++; // '='
        strings[name] = readValue().replace(/,$/, '');
        ws(); i++; // closing brace
        continue;
      }
      ws();
      const keyEnd = src.indexOf(',', i);
      const entry = { type, key: src.slice(i, keyEnd).trim(), fields: {} };
      i = keyEnd + 1;
      for (;;) {
        ws();
        if (src[i] === '}' || src[i] === ')' || i >= n) { i++; break; }
        const nm = /^[\w-]+/.exec(src.slice(i));
        if (!nm) { i++; continue; }
        i += nm[0].length; ws();
        if (src[i] !== '=') continue;
        i++;
        entry.fields[nm[0].toLowerCase()] = readValue();
        ws();
        if (src[i] === ',') i++;
      }
      entries.push(entry);
    }
    return entries;
  }

  // "Last, First and Other, Name" → ["F. Last", ...]
  function formatAuthors(field) {
    return field.split(/\s+and\s+/).map(a => {
      const [last, first = ''] = a.includes(',') ? a.split(',').map(s => s.trim()) : [a.split(' ').pop(), a.split(' ').slice(0, -1).join(' ')];
      const initials = first.split(/[\s-]+/).filter(Boolean).map(p => p[0] + '.').join(' ');
      return { display: (initials ? initials + ' ' : '') + last, last, initials };
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseBibtex, formatAuthors };
    return;
  }

  /* ================= browser runtime ================= */
  const doc = root.document;
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const D = root.FOLIO;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = d => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d + 'T00:00:00'));

  /* ---------- theme ---------- */
  const html = doc.documentElement;
  const media = root.matchMedia('(prefers-color-scheme: dark)');
  const setting = () => { try { return localStorage.getItem('theme') || 'system'; } catch (_) { return 'system'; } };
  function applyTheme() {
    const s = setting();
    html.setAttribute('data-theme-setting', s);
    html.setAttribute('data-theme', s === 'system' ? (media.matches ? 'dark' : 'light') : s);
  }
  function cycleTheme() {
    const next = { system: 'light', light: 'dark', dark: 'system' }[setting()];
    try { localStorage.setItem('theme', next); } catch (_) {}
    applyTheme();
    const btn = $('[data-theme-toggle]');
    btn.setAttribute('aria-label', `Theme: ${next}. Click to change.`);
    btn.title = `Theme: ${next}`;
  }
  media.addEventListener('change', applyTheme);

  /* ---------- chrome ---------- */
  const PAGES = [['about', 'index.html'], ['publications', 'publications.html']];
  function renderChrome() {
    const current = doc.body.dataset.page;
    const name = `<strong>${esc(D.site.first)}</strong> ${esc(D.site.middle)} ${esc(D.site.last)}`;
    $('[data-header]').outerHTML = `
      <div class="progress" data-progress></div>
      <nav class="navbar" aria-label="Main"><div class="container">
        <a class="navbar-brand" href="index.html">${current === 'about' ? '' : name}</a>
        <div style="display:flex;align-items:center;gap:4px">
          <ul class="nav-links">${PAGES.map(([t, h]) => `<li><a href="${h}"${t === current ? ' aria-current="page"' : ''}>${t}</a></li>`).join('')}</ul>
          <button class="theme-toggle" data-theme-toggle aria-label="Theme: ${setting()}. Click to change." title="Theme: ${setting()}">
            <svg class="i-system" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>
            <svg class="i-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            <svg class="i-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>
          </button>
          <button class="nav-burger" data-nav-toggle aria-label="Toggle navigation" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
        </div>
      </div></nav>`;
    $('[data-footer]').outerHTML = `
      <footer>© ${new Date().getFullYear()} ${esc(D.site.first)} ${esc(D.site.middle)} ${esc(D.site.last)}.
        Structure rebuilt from the MIT-licensed <a href="https://github.com/alshedivat/al-folio">al-folio</a> theme, without Jekyll.</footer>
      <button class="back-to-top" data-back-to-top aria-label="Back to top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 15l6-6 6 6"/></svg></button>`;

    $('[data-theme-toggle]').addEventListener('click', cycleTheme);
    const navBtn = $('[data-nav-toggle]');
    navBtn.addEventListener('click', () => navBtn.setAttribute('aria-expanded', String(doc.body.classList.toggle('nav-open'))));
    const top = $('[data-back-to-top]'), bar = $('[data-progress]');
    top.addEventListener('click', () => root.scrollTo({ top: 0, behavior: 'smooth' }));
    const onScroll = () => {
      const max = doc.documentElement.scrollHeight - root.innerHeight;
      bar.style.width = max > 0 ? (root.scrollY / max * 100) + '%' : '0';
      top.classList.toggle('show', root.scrollY > 300);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- publications ---------- */
  const entries = parseBibtex(D.bibtex);

  function renderEntry(e) {
    const f = e.fields;
    const authors = formatAuthors(f.author || '').map(a =>
      a.last === D.site.last ? `<span class="me">${esc(a.display)}</span>` : esc(a.display));
    const authorText = authors.length > 2 ? authors.slice(0, -1).join(', ') + ', and ' + authors.at(-1)
      : authors.join(' and ');
    const venue = f.booktitle ? 'In ' + f.booktitle : f.journal ? f.journal + (f.volume ? `, vol. ${f.volume}` : '') + (f.pages ? `, pp. ${f.pages.replace('--', '–')}` : '') : f.howpublished || '';
    const id = 'bib-' + e.key;
    const bibText = `@${e.type}{${e.key},\n` + Object.entries(f)
      .filter(([k]) => !['abstract', 'selected', 'abbr', 'pdf', 'code', 'html'].includes(k))
      .map(([k, v]) => `  ${k.padEnd(9)} = {${v}}`).join(',\n') + '\n}';
    const links = [
      f.abstract && `<button class="btn-sm" data-toggle="${id}-abs" aria-expanded="false">Abs</button>`,
      `<button class="btn-sm" data-toggle="${id}-bib" aria-expanded="false">Bib</button>`,
      f.html && `<a class="btn-sm" href="${esc(f.html)}">HTML</a>`,
      f.pdf && `<a class="btn-sm" href="${esc(f.pdf)}">PDF</a>`,
      f.code && `<a class="btn-sm" href="${esc(f.code)}">Code</a>`,
    ].filter(Boolean).join('');
    return `<li id="${esc(e.key)}">
      <div class="abbr">${f.abbr ? `<span class="badge">${esc(f.abbr)}</span>` : ''}</div>
      <div>
        <div class="bib-title">${esc(f.title || '')}${f.selected === 'true' ? '<span class="selected-star" title="Selected">★</span>' : ''}</div>
        <div class="bib-author">${authorText}</div>
        <div class="bib-periodical">${esc(venue)}${f.year ? ', ' + esc(f.year) : ''}</div>
        <div class="links">${links}</div>
        ${f.abstract ? `<div class="hidden-block" id="${id}-abs"><p>${esc(f.abstract)}</p></div>` : ''}
        <div class="hidden-block" id="${id}-bib"><pre>${esc(bibText)}</pre></div>
      </div></li>`;
  }

  function bindToggles(scope) {
    $$('[data-toggle]', scope).forEach(b => b.addEventListener('click', () => {
      const target = doc.getElementById(b.dataset.toggle);
      const open = target.classList.toggle('open');
      b.setAttribute('aria-expanded', String(open));
      // like the original: opening Abs closes Bib for the same entry and vice versa
      const sib = b.dataset.toggle.endsWith('-abs') ? b.dataset.toggle.replace(/-abs$/, '-bib') : b.dataset.toggle.replace(/-bib$/, '-abs');
      const other = doc.getElementById(sib);
      if (open && other) { other.classList.remove('open'); $(`[data-toggle="${sib}"]`, scope)?.setAttribute('aria-expanded', 'false'); }
    }));
  }

  function renderPublications() {
    const host = $('[data-publications]');
    if (!host) return;
    const byYear = new Map();
    entries.slice().sort((a, b) => (b.fields.year || 0) - (a.fields.year || 0))
      .forEach(e => { const y = e.fields.year || 'Other'; byYear.has(y) || byYear.set(y, []); byYear.get(y).push(e); });
    host.innerHTML = [...byYear].map(([y, list]) =>
      `<h2 class="bibliography">${esc(y)}</h2><ol class="bibliography">${list.map(renderEntry).join('')}</ol>`).join('');
    bindToggles(host);

    const input = $('#bibsearch'), count = $('[data-bib-count]');
    const originals = new Map($$('ol.bibliography > li', host).map(li => [li, li.innerHTML]));
    function filter(term) {
      term = term.trim().toLowerCase();
      let shown = 0;
      originals.forEach((markup, li) => {
        li.innerHTML = markup;
        const hit = !term || li.textContent.toLowerCase().includes(term);
        li.classList.toggle('unloaded', !hit);
        if (hit) { shown++; if (term) highlight(li, term); }
      });
      bindToggles(host);
      $$('h2.bibliography', host).forEach(h => {
        const ol = h.nextElementSibling;
        const empty = !ol.querySelector(':scope > li:not(.unloaded)');
        h.classList.toggle('unloaded', empty); ol.classList.toggle('unloaded', empty);
      });
      count.textContent = term ? `${shown} / ${originals.size}편 일치` : `${originals.size}편`;
    }
    let t;
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {           // same 300 ms debounce as bibsearch.js
        history.replaceState(null, '', input.value ? '#' + encodeURIComponent(input.value) : location.pathname);
        filter(input.value);
      }, 300);
    });
    root.addEventListener('hashchange', () => { input.value = decodeURIComponent(location.hash.slice(1)); filter(input.value); });
    input.value = decodeURIComponent(location.hash.slice(1));
    filter(input.value);
  }

  function highlight(el, term) {
    const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement.closest('pre, .hidden-block, button') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const idx = node.nodeValue.toLowerCase().indexOf(term);
      if (idx < 0) return;
      const mark = doc.createElement('mark');
      const mid = node.splitText(idx);
      mid.splitText(term.length);
      mark.textContent = mid.nodeValue;
      mid.replaceWith(mark);
    });
  }

  /* ---------- about page ---------- */
  function renderAbout() {
    const news = $('[data-news]');
    if (!news) return;
    $('[data-name]').innerHTML = `<span class="fw-bold">${esc(D.site.first)}</span> ${esc(D.site.middle)} ${esc(D.site.last)}`;
    news.innerHTML = `<table class="news-table">${D.news.map(n => `<tr><th scope="row">${fmt(n.date)}</th><td>${n.html}</td></tr>`).join('')}</table>`;
    $('[data-latest-posts]').innerHTML = `<table class="news-table">${D.posts.map(p => `<tr><th scope="row">${fmt(p.date)}</th><td><a href="${p.href}">${esc(p.title)}</a></td></tr>`).join('')}</table>`;
    const sel = entries.filter(e => e.fields.selected === 'true');
    const host = $('[data-selected]');
    host.innerHTML = `<ol class="bibliography">${sel.map(renderEntry).join('')}</ol>`;
    bindToggles(host);
    $('[data-contact-note]').textContent = D.site.contactNote;
  }

  applyTheme();
  renderChrome();
  renderAbout();
  renderPublications();
  // enable colour transitions only after first paint, so the initial theme never animates
  requestAnimationFrame(() => html.classList.remove('no-transition'));
})(typeof window !== 'undefined' ? window : globalThis);
