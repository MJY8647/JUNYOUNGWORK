// Behaviour tests for the three clones (headless Chromium via Playwright) and
// the BibTeX parser. Run: node clones/test/clones.test.js [--screenshots DIR]
const path = require('path');
const assert = require('assert/strict');
const { chromium } = require('playwright');
const { parseBibtex, formatAuthors } = require('../al-folio-academic/assets/folio.js');

const ROOT = path.resolve(__dirname, '..');
const url = (p) => 'file://' + path.join(ROOT, p);
const shotDir = process.argv.includes('--screenshots') ? process.argv[process.argv.indexOf('--screenshots') + 1] : null;
let passed = 0;
const results = [];

async function test(name, fn) {
  try { await fn(); passed++; results.push(`  ✓ ${name}`); }
  catch (e) { results.push(`  ✗ ${name}\n      ${e.message}`); process.exitCode = 1; }
}

async function open(browser, page, opts = {}) {
  const p = await browser.newPage({ viewport: opts.viewport || { width: 1440, height: 900 }, colorScheme: opts.scheme || 'light' });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await p.goto(url(page));
  p.errors = errors;
  return p;
}

async function noHorizontalScroll(p) {
  const [sw, w] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  assert.ok(sw <= w, `horizontal overflow: scrollWidth ${sw} > ${w}`);
}

(async () => {
  /* ---------- unit: BibTeX ---------- */
  await test('bibtex: parses entries, @string macros, nested braces', () => {
    const src = `@string{ieee = {IEEE}}
      @article{a1, title = {The {GPU} Era}, author = {Seo, Hana and Kim, Min Ho}, year = {2025}, publisher = ieee}
      @misc{m2, title = "Quoted {value}", year = 2024}`;
    const e = parseBibtex(src);
    assert.equal(e.length, 2);
    assert.equal(e[0].key, 'a1');
    assert.equal(e[0].fields.title, 'The {GPU} Era');
    assert.equal(e[0].fields.publisher, 'IEEE');
    assert.equal(e[1].fields.title, 'Quoted {value}');
    assert.equal(e[1].fields.year, '2024');
  });
  await test('bibtex: author formatting', () => {
    assert.deepEqual(formatAuthors('Seo, Hana and Kim, Min-Ho').map(a => a.display), ['H. Seo', 'M. H. Kim']);
    assert.deepEqual(formatAuthors('Ada Lovelace').map(a => a.display), ['A. Lovelace']);
  });

  const browser = await chromium.launch();

  /* ---------- vCard ---------- */
  await test('vcard: nav switches pages and updates hash', async () => {
    const p = await open(browser, 'vcard-portfolio/index.html');
    await p.click('[data-nav-link="portfolio"]');
    assert.equal(await p.isVisible('[data-page="portfolio"]'), true);
    assert.equal(await p.isVisible('[data-page="about"]'), false);
    assert.equal(new URL(p.url()).hash, '#portfolio');
    assert.deepEqual(p.errors, []);
    await p.close();
  });
  await test('vcard: category filter shows only matching projects', async () => {
    const p = await open(browser, 'vcard-portfolio/index.html#portfolio');
    await p.click('[data-filter-btn="Applications"]');
    const visible = await p.$$eval('[data-filter-item].active', els => els.map(e => e.dataset.category));
    assert.ok(visible.length === 3 && visible.every(c => c === 'Applications'), JSON.stringify(visible));
    await p.close();
  });
  await test('vcard: mobile custom select filters too', async () => {
    const p = await open(browser, 'vcard-portfolio/index.html#portfolio', { viewport: { width: 390, height: 844 } });
    await p.click('[data-select]');
    await p.click('[data-select-item="Web design"]');
    assert.equal(await p.textContent('[data-select-value]'), 'Web design');
    assert.equal(await p.$$eval('[data-filter-item].active', e => e.length), 3);
    await noHorizontalScroll(p);
    await p.close();
  });
  await test('vcard: testimonial modal opens with content and closes on Escape', async () => {
    const p = await open(browser, 'vcard-portfolio/index.html');
    await p.click('[data-testimonials-item="1"]');
    assert.equal(await p.textContent('[data-modal-title]'), '박지민');
    assert.ok(await p.$eval('[data-modal-container]', e => e.classList.contains('active')));
    await p.keyboard.press('Escape');
    assert.ok(!(await p.$eval('[data-modal-container]', e => e.classList.contains('active'))));
    await p.close();
  });
  await test('vcard: form button enables only when valid', async () => {
    const p = await open(browser, 'vcard-portfolio/index.html#contact');
    assert.equal(await p.isDisabled('[data-form-btn]'), true);
    await p.fill('input[name=fullname]', 'Kim');
    await p.fill('input[name=email]', 'not-an-email');
    await p.fill('textarea[name=message]', 'Hello there, long enough');
    assert.equal(await p.isDisabled('[data-form-btn]'), true);
    await p.fill('input[name=email]', 'kim@example.com');
    assert.equal(await p.isDisabled('[data-form-btn]'), false);
    await p.close();
  });

  /* ---------- AstroWind ---------- */
  await test('astrowind: theme toggle flips .dark and persists', async () => {
    const p = await open(browser, 'astrowind-landing/index.html');
    assert.equal(await p.evaluate(() => document.documentElement.classList.contains('dark')), false);
    await p.click('[data-aw-toggle-color-scheme]');
    assert.equal(await p.evaluate(() => document.documentElement.classList.contains('dark')), true);
    await p.reload();
    assert.equal(await p.evaluate(() => document.documentElement.classList.contains('dark')), true);
    assert.deepEqual(p.errors, []);
    await p.close();
  });
  await test('astrowind: system dark preference applies before paint', async () => {
    const p = await open(browser, 'astrowind-landing/index.html', { scheme: 'dark' });
    assert.equal(await p.evaluate(() => document.documentElement.classList.contains('dark')), true);
    await p.close();
  });
  await test('astrowind: mobile menu opens and closes', async () => {
    const p = await open(browser, 'astrowind-landing/index.html', { viewport: { width: 390, height: 844 } });
    assert.equal(await p.isVisible('.mobile-menu'), false);
    await p.click('[data-aw-toggle-menu]');
    assert.equal(await p.isVisible('.mobile-menu'), true);
    await p.click('.mobile-menu a[href="index.html#faq"]');
    assert.equal(await p.isVisible('.mobile-menu'), false);
    await noHorizontalScroll(p);
    await p.close();
  });
  await test('astrowind: latest posts + scroll reveal', async () => {
    const p = await open(browser, 'astrowind-landing/index.html');
    assert.equal(await p.$$eval('[data-latest-posts] .post-card', e => e.length), 3);
    await p.locator('#faq').scrollIntoViewIfNeeded();
    await p.waitForFunction(() => document.querySelector('#faq details').classList.contains('in'));
    await p.close();
  });
  await test('astrowind: blog pagination, category and tag filters', async () => {
    const p = await open(browser, 'astrowind-landing/blog.html');
    assert.equal(await p.$$eval('.post-row', e => e.length), 4);
    assert.match(await p.textContent('[data-pagination]'), /1 \/ 2/);
    await p.goto(url('astrowind-landing/blog.html') + '?page=2');
    assert.equal(await p.$$eval('.post-row', e => e.length), 3);
    await p.goto(url('astrowind-landing/blog.html') + '?category=design');
    assert.equal(await p.$$eval('.post-row', e => e.length), 2);
    await p.goto(url('astrowind-landing/blog.html') + '?tag=css');
    assert.equal(await p.$$eval('.post-row', e => e.length), 3);
    assert.equal(await p.textContent('[data-blog-title]'), '태그: #css');
    await p.close();
  });
  await test('astrowind: post page renders, unknown slug shows not-found', async () => {
    const p = await open(browser, 'astrowind-landing/post.html?slug=dark-mode-without-flicker');
    assert.equal(await p.textContent('[data-post] h1'), '깜빡임 없는 다크 모드 구현');
    assert.ok((await p.$$eval('[data-post] .post-card', e => e.length)) >= 1, 'related posts');
    await p.goto(url('astrowind-landing/post.html') + '?slug=nope');
    assert.equal(await p.textContent('[data-post] h1'), '글을 찾을 수 없습니다');
    await p.close();
  });

  /* ---------- al-folio ---------- */
  await test('al-folio: theme cycles system → light → dark → system', async () => {
    const p = await open(browser, 'al-folio-academic/index.html', { scheme: 'dark' });
    const state = () => p.evaluate(() => [document.documentElement.dataset.themeSetting, document.documentElement.dataset.theme]);
    assert.deepEqual(await state(), ['system', 'dark']);
    await p.click('[data-theme-toggle]'); assert.deepEqual(await state(), ['light', 'light']);
    await p.click('[data-theme-toggle]'); assert.deepEqual(await state(), ['dark', 'dark']);
    await p.click('[data-theme-toggle]'); assert.deepEqual(await state(), ['system', 'dark']);
    assert.deepEqual(p.errors, []);
    await p.close();
  });
  await test('al-folio: about shows news, posts and only selected papers', async () => {
    const p = await open(browser, 'al-folio-academic/index.html');
    assert.equal(await p.$$eval('[data-news] tr', e => e.length), 4);
    assert.equal(await p.$$eval('[data-selected] ol > li', e => e.length), 2);
    await p.close();
  });
  await test('al-folio: publications grouped by year, abs/bib toggles', async () => {
    const p = await open(browser, 'al-folio-academic/publications.html');
    assert.deepEqual(await p.$$eval('h2.bibliography', e => e.map(x => x.textContent)), ['2026', '2025', '2024', '2023']);
    const abs = '[data-toggle="bib-seo2025curves-abs"]', bib = '[data-toggle="bib-seo2025curves-bib"]';
    await p.click(abs);
    assert.equal(await p.isVisible('#bib-seo2025curves-abs'), true);
    await p.click(bib);
    assert.equal(await p.isVisible('#bib-seo2025curves-abs'), false, 'opening Bib closes Abs');
    assert.match(await p.textContent('#bib-seo2025curves-bib pre'), /@article\{seo2025curves/);
    await p.close();
  });
  await test('al-folio: search filters, highlights, hides empty years, syncs hash', async () => {
    const p = await open(browser, 'al-folio-academic/publications.html');
    await p.fill('#bibsearch', 'eccv');
    await p.waitForFunction(() => location.hash === '#eccv');
    assert.equal(await p.$$eval('ol.bibliography > li:not(.unloaded)', e => e.length), 1);
    assert.deepEqual(await p.$$eval('h2.bibliography:not(.unloaded)', e => e.map(x => x.textContent)), ['2025']);
    assert.equal((await p.$$eval('mark', e => e.map(x => x.textContent.toLowerCase())))[0], 'eccv');
    await p.goto(url('al-folio-academic/publications.html') + '#survey');
    assert.equal(await p.inputValue('#bibsearch'), 'survey');
    assert.equal(await p.$$eval('ol.bibliography > li:not(.unloaded)', e => e.length), 1);
    await noHorizontalScroll(p);
    await p.close();
  });

  /* ---------- optional screenshots ---------- */
  if (shotDir) {
    const pages = [
      ['vcard', 'vcard-portfolio/index.html', 'dark'], ['vcard-portfolio', 'vcard-portfolio/index.html#portfolio', 'dark'],
      ['astrowind', 'astrowind-landing/index.html', 'light'], ['astrowind-dark', 'astrowind-landing/index.html', 'dark'],
      ['astrowind-blog', 'astrowind-landing/blog.html', 'light'],
      ['alfolio', 'al-folio-academic/index.html', 'light'], ['alfolio-pubs-dark', 'al-folio-academic/publications.html', 'dark'],
    ];
    for (const [name, pg, scheme] of pages) {
      for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
        const p = await browser.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, deviceScaleFactor: 1 });
        await p.goto(url(pg));
        await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 300) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 30)); } scrollTo({ top: 0, behavior: 'instant' }); });
        await p.waitForTimeout(900);
        await p.screenshot({ path: path.join(shotDir, `${name}-${tag}.png`), fullPage: tag === 'desktop' });
        await p.close();
      }
    }
  }

  await browser.close();
  console.log(results.join('\n'));
  console.log(`\n${passed}/${results.length} passed`);
})();
