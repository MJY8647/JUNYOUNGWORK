// Render a site (reference or your rebuild) and capture what a visitor sees.
// Usage: node capture.js <url-or-file> <outdir> [--frames N]
// Writes desktop (1440x900) and mobile (390x844) screenshots at several scroll depths,
// a full-page shot, and network.json listing loaded scripts/styles/fonts/media (stack evidence).
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const [target, outDir] = process.argv.slice(2);
  if (!target || !outDir) { console.error('usage: node capture.js <url-or-file> <outdir> [--frames N]'); process.exit(1); }
  const frames = process.argv.includes('--frames') ? +process.argv[process.argv.indexOf('--frames') + 1] : 6;
  const url = /^https?:|^file:/.test(target) ? target : 'file://' + path.resolve(target);
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const network = [];
  for (const [tag, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => { const t = r.request().resourceType();
      if (tag === 'desktop' && ['script', 'stylesheet', 'font', 'media', 'image', 'fetch', 'xhr'].includes(t)) network.push({ type: t, status: r.status(), url: r.url() }); });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3000); // loaders, intro animations
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let i = 0; i < frames; i++) {
      const y = Math.round((total - viewport.height) * (i / Math.max(1, frames - 1)));
      await page.mouse.wheel(0, y - (await page.evaluate(() => scrollY))); // real wheel so scroll libraries react
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outDir, `${tag}-${String(i).padStart(2, '0')}.png`) });
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(outDir, `${tag}-full.png`), fullPage: true }).catch(() => {});
    if (errors.length) console.log(`${tag} page errors:`, errors.slice(0, 5));
    await page.close();
  }
  fs.writeFileSync(path.join(outDir, 'network.json'), JSON.stringify(network, null, 2));
  const byType = network.reduce((a, n) => ((a[n.type] = (a[n.type] || 0) + 1), a), {});
  console.log('captured to', outDir, byType);
  await browser.close();
})();
