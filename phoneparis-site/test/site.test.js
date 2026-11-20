// node phoneparis-site/test/site.test.js  [--shots <dir>]
// 사람처럼 탭으로 견적 → 시세표 → 사후관리까지 확인합니다.
const { chromium } = require("playwright");
const path = require("path");
const url = process.env.PP_URL || "file://" + path.resolve(__dirname, "../index.html");
const shotsIdx = process.argv.indexOf("--shots");
const shots = shotsIdx > -1 ? process.argv[shotsIdx + 1] : null;

let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };

async function page(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.vp || { width: 1280, height: 860 }, colorScheme: opts.scheme || "light",
    reducedMotion: opts.reduced ? "reduce" : "no-preference", acceptDownloads: true, deviceScaleFactor: shots ? 2 : 1 });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
  await p.goto(url);
  return { p, ctx, errors };
}
// 타일 제목(b)이 정확히 일치하는 것 (정규식이면 부분 일치)
const tile = (p, text) => p.locator("#stage .tile").filter({
  has: p.locator("b", { hasText: text instanceof RegExp ? text : new RegExp("^" + text.replace(/[.+*?()[\]]/g, "\\$&") + "$") }),
}).first();

(async () => {
  const browser = await chromium.launch();

  // 1) 전체 견적 흐름
  {
    const { p, ctx, errors } = await page(browser);
    ok(await p.locator("#steps button").count() === 10, "10단계 표시");
    ok(await p.locator("#nextBtn").isDisabled(), "기종 고르기 전 다음 비활성");
    await tile(p, "18 Pro").click();                       // 기종 → 자동 이동
    ok(await p.locator("#steps .cur").innerText() === "용량", "기종 탭 후 용량 단계로 자동 이동");
    await tile(p, "256GB").click();
    await tile(p, "SKT").click(); await tile(p, "번호이동").click();
    ok(await p.locator("#steps .cur").innerText() === "요금", "통신사+가입유형 후 요금 단계");
    await tile(p, "10.9만").click();
    await tile(p, "6.9만").click();                         // 183일 후 변경
    ok(await p.locator("#steps .cur").innerText() === "지원", "변경 요금제 후 지원 단계");
    ok(await p.locator("#stage .badge").count() === 1, "공시/선약 중 유리한 쪽 표시");
    await p.locator("#stage .chip", { hasText: /^20만$/ }).first().click();
    const st = await p.evaluate(() => window.PP.state());
    ok(st.extra === 200000, "추가지원금 20만 선택");
    await p.click("#nextBtn");
    await p.locator("#stage .chip", { hasText: "24개월" }).click();
    await p.locator("#stage .chip", { hasText: /^10만$/ }).click();
    await p.click("#nextBtn");
    await tile(p, "폰 보험").click();
    await p.locator("#stage .chip", { hasText: "가족결합" }).click();
    await p.click("#nextBtn");
    ok(await p.locator(".hero-num .big b").isVisible(), "견적 결과 큰 숫자 표시");
    const q = await p.evaluate(() => { const s = window.PP.state(); return window.PP.quote(s); });
    const expected = 1990000 - q.pick.sub - 200000 - 100000;
    ok(Math.abs(q.pick.principal - Math.max(0, expected)) < 1, "할부원금 = 출고가 − 공시(선택 시) − 추가 − 반납");
    ok(q.con.sub === 0 && q.con.principal === 1990000 - 300000, "선택약정 할부원금 계산");
    const dock = await p.locator("#dockPrin").innerText();
    ok(dock !== "–", "하단 요약 바에 할부원금 표시: " + dock);
    await p.locator("#stage .tile", { hasText: "견적서" }).click();
    ok(await p.locator("#receipt").evaluate((d) => d.open), "견적서 다이얼로그 열림");
    if (shots) await p.screenshot({ path: shots + "/receipt.png" });
    await p.keyboard.press("Escape");
    ok(!(await p.locator("#receipt").evaluate((d) => d.open)), "Esc로 닫힘");
    if (shots) await p.screenshot({ path: shots + "/desktop-result.png" });
    await p.click("#nextBtn");
    await tile(p, /신분증/).click(); await tile(p, /유심/).click();
    ok(await p.locator(".meter b").innerText() === "2 / 10", "체크리스트 진행률");

    // 새로고침해도 유지
    await p.reload();
    ok(await p.locator("#steps .cur").innerText() === "체크", "새로고침 후 단계 유지");

    // 2) 사후관리
    await p.click('[data-mode="care"]');
    await p.fill("#careDate", "2026-01-01");
    await p.dispatchEvent("#careDate", "change");
    const ev = await p.evaluate(() => window.PP.careEvents().map((e) => [e.title, e.date.getFullYear() + "-" + (e.date.getMonth() + 1) + "-" + e.date.getDate()]));
    const plan = ev.find((e) => e[0] === "요금제 변경 가능");
    ok(plan && plan[1] === "2026-7-3", "2026-01-01 개통 → 요금제 변경 7/3 (183일 기준): " + (plan && plan[1]));
    ok(ev.some((e) => e[0] === "폰 보험 해지 가능" && e[1] === "2026-4-1"), "부가서비스 해지일 (3개월)");
    ok(ev.some((e) => e[0].startsWith("약정 만료 ·") && e[1] === "2028-1-1"), "24개월 약정 만료일");
    const g = await p.locator("#timeline li", { hasText: "요금제 변경 가능" }).locator(".gcal").getAttribute("href");
    ok(/calendar\.google\.com.*dates=20260703\/20260704/.test(g), "요금제 변경일 구글 캘린더 링크");
    if (shots) await p.screenshot({ path: shots + "/desktop-care.png" });

    // 3) 시세표
    await p.click('[data-mode="board"]');
    ok(await p.locator("#boardCanvas").isVisible(), "시세표 캔버스 표시");
    const before = await p.evaluate(() => document.getElementById("boardCanvas").height);
    await p.locator("#boardControls .chip", { hasText: "S26+" }).click();
    await p.locator("#boardControls .chip", { hasText: "17e" }).click();
    const after = await p.evaluate(() => document.getElementById("boardCanvas").height);
    ok(after >= before, "기종 추가 시 시세표 확장");
    const painted = await p.evaluate(() => {
      const c = document.getElementById("boardCanvas"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      const seen = new Set(); for (let i = 0; i < d.length; i += 4000) seen.add(d[i] + "," + d[i + 1] + "," + d[i + 2]); return seen.size;
    });
    ok(painted > 3, "캔버스에 실제로 그려짐");
    await p.click("#boardPng");
    ok(await p.locator("#imgSheet").evaluate((d) => d.open) && (await p.locator("#boardImg").getAttribute("src")).startsWith("data:image/png"), "시세표 이미지 창 (길게 눌러 저장)");
    const [png] = await Promise.all([p.waitForEvent("download"), p.click("#imgFile")]);
    ok(/\.png$/.test(png.suggestedFilename()), "로컬에선 PNG 파일 받기");
    await p.keyboard.press("Escape");
    if (shots) await p.screenshot({ path: shots + "/desktop-board.png", fullPage: true });
    ok(errors.length === 0, "JS 오류 없음 " + errors.join(" | "));
    await ctx.close();
  }

  // 4) 모바일 · 다크 · 감소된 모션
  for (const scheme of ["light", "dark"]) {
    const { p, ctx, errors } = await page(browser, { vp: { width: 390, height: 844 }, scheme, reduced: scheme === "dark" });
    await tile(p, "18 Pro").click();
    if (shots) { await p.waitForTimeout(450); await p.screenshot({ path: `${shots}/mobile-${scheme}-storage.png` }); }
    await tile(p, "256GB").click(); await tile(p, "KT").click(); await tile(p, "기기변경").click();
    await tile(p, "9.5만").click(); await tile(p, "유지").click();
    if (shots) { await p.waitForTimeout(450); await p.screenshot({ path: `${shots}/mobile-${scheme}-support.png` }); }
    for (let i = 0; i < 3; i++) await p.click("#nextBtn");
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    ok(!overflow, `모바일(${scheme}) 가로 스크롤 없음`);
    if (shots) { await p.waitForTimeout(450); await p.screenshot({ path: `${shots}/mobile-${scheme}-result.png` }); }
    for (const m of ["board", "care"]) {
      await p.click(`[data-mode="${m}"]`);
      ok(!(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), `모바일 ${m} 가로 스크롤 없음`);
      if (shots) await p.screenshot({ path: `${shots}/mobile-${scheme}-${m}.png`, fullPage: m === "care" });
    }
    ok(errors.length === 0, `모바일(${scheme}) JS 오류 없음 ` + errors.join(" | "));
    await ctx.close();
  }

  // 5) 테마 전환 유지
  {
    const { p, ctx } = await page(browser);
    await p.click("#themeBtn"); await p.click("#themeBtn");
    await p.reload();
    ok(await p.evaluate(() => document.documentElement.dataset.theme) === "dark", "테마 선택 유지");
    await ctx.close();
  }

  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
  process.exit(fails ? 1 : 0);
})();
