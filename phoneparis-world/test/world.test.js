// node phoneparis-world/test/world.test.js [--shots dir]
const { chromium } = require("playwright");
const path = require("path");
const url = process.env.PP_URL || "file://" + path.resolve(__dirname, "../index.html");
const si = process.argv.indexOf("--shots"), shots = si > -1 ? process.argv[si + 1] : null;
const GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };

async function open(browser, o = {}) {
  const ctx = await browser.newContext({ viewport: o.vp || { width: 1280, height: 800 }, reducedMotion: o.reduced ? "reduce" : "no-preference", deviceScaleFactor: shots && o.shot ? 2 : 1 });
  const p = await ctx.newPage(), errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
  await p.goto(url);
  await p.waitForFunction(() => document.body.classList.contains("ready"), null, { timeout: 40000 });
  return { p, ctx, errors };
}
const stop = async (p, i) => { await p.evaluate((i) => scrollTo(0, i * innerHeight), i); await p.waitForTimeout(900); };

(async () => {
  const browser = await chromium.launch({ args: GL });
  {
    const { p, ctx, errors } = await open(browser, { shot: true });
    const info = await p.evaluate(() => PP.world() && PP.world().info());
    ok(info && info.frames > 2, "3D 월드 렌더링 시작 (frames " + (info && info.frames) + ")");
    ok(info.segments > 1000, "에펠탑 철골 " + info.segments + "개");
    ok(await p.locator(".stop").count() === 10 && await p.locator("#chapters button").count() === 10, "장면 10개 + 장면 버튼 10개");
    const varied = await p.evaluate(() => { const c = document.createElement("canvas"); c.width = 64; c.height = 40; const x = c.getContext("2d"); const w = PP.world(); w.renderer.render(w.scene, w.camera); x.drawImage(document.getElementById("world"), 0, 0, 64, 40); const d = x.getImageData(0, 0, 64, 40).data; const s = new Set(); for (let i = 0; i < d.length; i += 4) s.add(d[i] >> 3 << 10 | d[i + 1] >> 3 << 5 | d[i + 2] >> 3); return s.size; });
    ok(varied > 20, "캔버스에 실제 장면이 그려짐 (색 " + varied + "종)");
    const cam0 = info.cam;
    await stop(p, 2);
    const cam2 = await p.evaluate(() => PP.world().info().cam);
    ok(cam0[1] > 100 && cam2[1] < 10, "스크롤하면 카메라가 광장 위에서 지상으로 내려옴");
    ok(await p.locator("#card").evaluate((e) => !e.classList.contains("on")), "노점 장면에선 카드 없음");

    // 디자이너
    await stop(p, 3);
    await p.waitForSelector("#card.on", { timeout: 4000 }).catch(() => {});
    ok(await p.locator("#card.on .badge").innerText() === "디자이너폰팔이", "디자이너 카드 등장");
    ok(await p.locator("#bubble").isVisible(), "말풍선 표시");
    const head = await p.evaluate(() => PP.world().headOnScreen("designer"));
    await p.mouse.move(head.x, head.y + 140);
    await p.waitForTimeout(200);
    ok(await p.evaluate(() => document.getElementById("world").style.cursor) === "pointer", "캐릭터에 마우스 올리면 클릭 가능 표시");
    await p.locator("#card .chip", { hasText: "키링" }).click();
    ok(await p.locator("#card .chip.on").count() === 1, "디자이너 칩 토글");
    if (shots) await p.screenshot({ path: shots + "/desktop-designer.png" });
    await p.locator("#card .prod").first().click();
    ok(await p.locator("#sheet").evaluate((d) => d.open), "상품 상세 시트 열림");
    ok((await p.locator("#sheetBody").innerText()).includes("552,000"), "상세에 가격 표시");
    await p.locator("#sheetBody button", { hasText: "이 폰으로 상담" }).click();
    ok((await p.locator(".tel").innerText()) === "1533-3364", "상담 시트에 전화번호");
    await p.keyboard.press("Escape");

    // 퀵퀵이
    await stop(p, 4);
    await p.locator("#card .steps-list button").nth(1).click();
    ok(await p.locator("#card .steps-list li.open").count() === 1, "퀵퀵이 단계 펼치기");
    await p.locator("#card .primary").click();
    ok(await p.locator("#sheetBody .pick-grid .prod").count() >= 6, "퀵으로 받기 → 모델 고르기");
    await p.locator("#sheetBody .pick-grid .prod").first().click();
    ok((await p.locator("#sheetBody").innerText()).includes("퀵배송"), "선택 모델 + 받는 방법이 상담 요약에");
    await p.keyboard.press("Escape");

    // 자린고비
    await stop(p, 5);
    const first = await p.locator("#card .prod b").first().innerText();
    await p.locator("#card .chip", { hasText: "0원만" }).click();
    ok(await p.locator("#card .prod").count() === 2 && /A17|폴더/.test(first), "자린고비 싼 순 정렬 + 0원만 필터");

    // 세이프티
    await stop(p, 6);
    await p.locator("#card .combo button").nth(1).click();
    await p.locator("#card .primary").click();
    const safeTxt = await p.locator("#sheetBody").innerText();
    ok(safeTxt.includes("강화 케이스 + 휴대폰 보험") && !safeTxt.includes("강화 필름"), "보호 조합 토글이 상담 요약에 반영");
    await p.keyboard.press("Escape");

    // 중고폰
    await stop(p, 7);
    await p.locator("#card .grades button").nth(1).click();
    await p.locator("#card .primary").click();
    ok((await p.locator("#sheetBody").innerText()).includes("미개봉급"), "중고폰 등급 선택 → 상담");
    await p.keyboard.press("Escape");

    // 올인원
    await stop(p, 8);
    ok(await p.locator("#card .grid3 .prod").count() === 6, "올인원 모델 6개 그리드");

    // 장면 버튼으로 이동
    await p.locator("#chapters button").nth(0).click();
    await p.waitForTimeout(1500);
    ok(await p.evaluate(() => scrollY) < 50, "장면 버튼으로 처음으로 이동");

    // 폰꾸 작업실
    await p.click("#topCta");
    ok(await p.locator("#studio").evaluate((d) => d.open) && await p.locator("#studioCanvas canvas").count() === 1, "3D 폰꾸 작업실 열림");
    await p.locator("#studioNext").click();
    await p.locator("#studioBody .opt", { hasText: "코발트" }).click();
    ok(await p.locator("#studioTotal").innerText() === "24,000원", "케이스 선택 → 합계 24,000원");
    await p.locator("#studioNext").click();
    await p.locator("#studioBody .opt", { hasText: "오렌지 볼" }).click();
    await p.locator("#studioNext").click();
    await p.locator("#studioBody .opt", { hasText: "그립톡" }).click();
    ok(await p.locator("#studioTotal").innerText() === "47,000원", "키링 + 그립톡 → 합계 47,000원");
    const box = await p.locator("#studioCanvas").boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down(); await p.mouse.move(box.x + box.width / 2 + 160, box.y + box.height / 2, { steps: 8 }); await p.mouse.up();
    if (shots) { await p.waitForTimeout(400); await p.screenshot({ path: shots + "/desktop-studio.png" }); }
    await p.locator("#studioNext").click();
    await p.locator("#studioBody button", { hasText: "이미지 보기" }).click();
    ok((await p.locator("#sheetBody img").getAttribute("src")).startsWith("data:image/png"), "꾸민 폰 이미지 만들기");
    await p.keyboard.press("Escape");
    await p.locator("#studioBody button", { hasText: "이 조합으로 상담" }).click();
    ok((await p.locator("#sheetBody").innerText()).includes("47,000원"), "조합이 상담 요약에 들어감");
    await p.keyboard.press("Escape");
    await p.reload(); await p.waitForFunction(() => document.body.classList.contains("ready"));
    ok((await p.evaluate(() => PP.state().studio.case)) === "cobalt", "폰꾸 조합 새로고침 후 유지");
    ok(errors.length === 0, "JS 오류 없음 " + errors.join(" | "));
    await ctx.close();
  }
  // 모바일 + 감소된 모션
  {
    const { p, ctx, errors } = await open(browser, { vp: { width: 390, height: 844 }, reduced: true, shot: true });
    for (const i of [0, 3, 6, 9]) {
      await stop(p, i);
      ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `모바일 장면 ${i} 가로 스크롤 없음`);
      if (shots) await p.screenshot({ path: `${shots}/mobile-${i}.png` });
    }
    ok(await p.evaluate(() => document.getElementById("world").style.filter) === "", "모션 줄이기: 블러 없음");
    await p.click("#topCta");
    if (shots) { await p.waitForTimeout(500); await p.screenshot({ path: shots + "/mobile-studio.png" }); }
    ok(errors.length === 0, "모바일 JS 오류 없음 " + errors.join(" | "));
    await ctx.close();
  }
  await browser.close();
  // WebGL 없음 → 영상 프레임으로 대체
  {
    const b2 = await chromium.launch({ args: ["--disable-webgl", "--disable-3d-apis"] });
    const { p, ctx } = await open(b2);
    await stop(p, 3);
    ok(await p.locator("#fallback").isVisible() && /060\.webp/.test(await p.locator("#fallbackImg").getAttribute("src")), "WebGL 없으면 영상 장면 이미지로 대체");
    ok(await p.locator("#card.on").count() === 1, "대체 모드에서도 카드 동작");
    await ctx.close(); await b2.close();
  }
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
  process.exit(fails ? 1 : 0);
})();
