// Behaviour tests for studio-site (headless Chromium via Playwright).
// Run: node studio-site/test/site.test.js [--screenshots DIR]
const path = require('path');
const assert = require('assert/strict');
const { chromium } = require('playwright');

const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
const shotDir = process.argv.includes('--screenshots') ? process.argv[process.argv.indexOf('--screenshots') + 1] : null;
const results = []; let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; results.push(`  ✓ ${name}`); }
  catch (e) { results.push(`  ✗ ${name}\n      ${e.message.split('\n')[0]}`); process.exitCode = 1; }
}
async function open(browser, opts = {}) {
  const p = await browser.newPage({ viewport: opts.viewport || { width: 1440, height: 900 }, colorScheme: opts.scheme || 'light', reducedMotion: opts.reducedMotion || 'no-preference' });
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(e.message));
  // web fonts may be unreachable offline; that is not an app error
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text()) && p.errors.push(m.text()));
  await p.goto(URL);
  await p.waitForFunction(() => !document.documentElement.classList.contains('is-loading'), null, { timeout: 8000 });
  return p;
}
const count = (p) => p.textContent('[data-work-count]');

(async () => {
  const browser = await chromium.launch();

  await test('loader finishes, content renders, no JS errors', async () => {
    const p = await open(browser);
    await p.waitForSelector('[data-gate]', { state: 'hidden' });
    assert.match(await p.textContent('[data-hero-title]'), /당신의 이야기/);
    assert.equal(await p.$$eval('[data-card]', (e) => e.length), 10);
    assert.equal(await p.$$eval('.portal', (e) => e.length), 3);
    assert.deepEqual(p.errors, []);
    await p.close();
  });

  await test('menu opens, traps focus, closes on Escape and returns focus', async () => {
    const p = await open(browser);
    await p.click('[data-menu-open]');
    assert.equal(await p.isVisible('.menu__card'), true);
    assert.equal(await p.getAttribute('[data-menu-open]', 'aria-expanded'), 'true');
    for (let i = 0; i < 25; i++) await p.keyboard.press('Tab');
    assert.ok(await p.evaluate(() => document.querySelector('.menu__card').contains(document.activeElement)), 'focus escaped the menu');
    await p.keyboard.press('Escape');
    assert.equal(await p.isVisible('.menu__card'), false);
    assert.ok(await p.evaluate(() => document.activeElement.matches('[data-menu-open]')));
    await p.close();
  });

  await test('theme switch: System → Dark persists across reload, Light overrides OS dark', async () => {
    const p = await open(browser, { scheme: 'dark' });
    assert.equal(await p.getAttribute('html', 'data-theme'), 'dark');
    await p.click('[data-menu-open]');
    await p.click('[data-theme-set="light"]');
    assert.equal(await p.getAttribute('html', 'data-theme'), 'light');
    await p.reload(); await p.waitForTimeout(100);
    assert.equal(await p.getAttribute('html', 'data-theme'), 'light');
    assert.equal(await p.getAttribute('html', 'data-theme-mode'), 'light');
    await p.close();
  });

  await test('gallery: arrow keys move, loops past the end, Enter opens project', async () => {
    const p = await open(browser);
    await p.focus('[data-gallery]');
    await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
    await p.waitForFunction(() => document.querySelector('[data-work-count]').textContent === '03 / 10');
    await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft');
    await p.waitForFunction(() => document.querySelector('[data-work-count]').textContent === '10 / 10');
    assert.equal(await p.getAttribute('[data-card="9"]', 'aria-selected'), 'true');
    await p.keyboard.press('Enter');
    assert.equal(await p.isVisible('[data-project-dialog]'), true);
    assert.match(await p.textContent('[data-project-title]'), /한 접시로/);
    await p.close();
  });

  await test('gallery: pointer drag to the left advances cards', async () => {
    const p = await open(browser);
    await p.evaluate(() => document.querySelector('#work').scrollIntoView({ behavior: 'instant' }));
    await p.waitForTimeout(300);
    const b = await (await p.$('[data-gallery]')).boundingBox();
    const box = b;
    const y = b.y + b.height / 2, x = b.x + b.width / 2;
    await p.mouse.move(x, y); await p.mouse.down();
    for (let i = 1; i <= 10; i++) { await p.mouse.move(x - i * 60, y); await p.waitForTimeout(16); }
    await p.mouse.up();
    await p.waitForTimeout(900);
    assert.notEqual(await count(p), '01 / 10');
    assert.ok(box.width > 0);
    await p.close();
  });

  await test('enquiry: step validation, intent + chips, success state', async () => {
    const p = await open(browser);
    await p.click('.nav-pill [data-enquiry-open]');
    assert.equal(await p.isVisible('[data-enquiry]'), true);
    await p.click('[data-step="1"] [data-next]');
    assert.match(await p.textContent('[data-enquiry-error]'), /이메일/);
    await p.fill('input[name=name]', '김준영');
    await p.fill('input[name=email]', 'kim@example.com');
    await p.click('[data-step="1"] [data-next]');
    assert.ok(await p.$eval('[data-step="2"]', (e) => e.classList.contains('is-open')));
    await p.click('[data-intent="채용 지원"]');
    assert.equal(await p.getAttribute('[data-intent="채용 지원"]', 'aria-checked'), 'true');
    await p.click('[data-step="2"] [data-next]');
    await p.click('[data-enquiry-form] button[type=submit]');
    assert.match(await p.textContent('[data-enquiry-error]'), /분야/);
    await p.click('[data-chip="브랜드"]');
    await p.fill('textarea[name=message]', '브랜드 리뉴얼과 웹사이트 제작을 문의합니다.');
    await p.click('[data-enquiry-form] button[type=submit]');
    assert.equal(await p.isVisible('[data-enquiry-done]'), true);
    await p.close();
  });

  await test('newsletter validates email', async () => {
    const p = await open(browser);
    await p.fill('#nl-email', 'nope');
    await p.click('[data-newsletter] button');
    assert.match(await p.textContent('[data-newsletter-msg]'), /올바른/);
    await p.fill('#nl-email', 'a@b.co');
    await p.click('[data-newsletter] button');
    assert.match(await p.textContent('[data-newsletter-msg]'), /접수/);
    await p.close();
  });

  await test('mobile: no horizontal overflow, menu usable', async () => {
    const p = await open(browser, { viewport: { width: 390, height: 844 } });
    const [sw, w] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    assert.ok(sw <= w, `overflow ${sw} > ${w}`);
    await p.click('[data-menu-open]');
    assert.equal(await p.isVisible('.menu__pages'), true);
    await p.click('[data-menu-link][href="#work"]');
    assert.equal(await p.isVisible('.menu__card'), false);
    await p.close();
  });

  await test('reduced motion: loader skips, pen marks drawn immediately', async () => {
    const p = await open(browser, { reducedMotion: 'reduce' });
    await p.evaluate(() => document.querySelector('.manifesto').scrollIntoView());
    await p.waitForFunction(() => document.querySelector('.manifesto__text').classList.contains('is-in'));
    const off = await p.$eval('.manifesto__text .pen path', (e) => getComputedStyle(e).strokeDashoffset);
    assert.equal(parseFloat(off), 0);
    await p.close();
  });

  if (shotDir) {
    for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
      for (const scheme of ['light', 'dark']) {
        const p = await open(browser, { viewport: { width: w, height: h }, scheme });
        await p.waitForSelector('[data-gate]', { state: 'hidden' }); await p.waitForTimeout(1500);
        await p.screenshot({ path: path.join(shotDir, `studio-hero-${scheme}-${tag}.png`) });
        for (const [sel, name] of [['.manifesto', 'manifesto'], ['#work', 'work'], ['#about', 'about']]) {
          await p.evaluate((s) => document.querySelector(s).scrollIntoView({ behavior: 'instant' }), sel);
          await p.waitForTimeout(1600);
          if (scheme === 'light') await p.screenshot({ path: path.join(shotDir, `studio-${name}-${tag}.png`) });
        }
        if (scheme === 'light') {
          await p.evaluate(() => scrollTo(0, 0)); await p.click('[data-menu-open]'); await p.waitForTimeout(600);
          await p.screenshot({ path: path.join(shotDir, `studio-menu-${tag}.png`) });
        }
        await p.close();
      }
    }
  }

  await browser.close();
  console.log(results.join('\n'));
  console.log(`\n${passed}/${results.length} passed`);
})();
