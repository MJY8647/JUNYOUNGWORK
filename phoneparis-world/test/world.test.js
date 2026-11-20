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
  // 스크린샷을 찍는 창은 ?shot (그리지 않는 프레임이 있어도 캔버스가 비어 찍히지 않게)
  await p.goto(shots && o.shot ? url + (url.includes("?") ? "&" : "?") + "shot" : url);
  await p.waitForFunction(() => document.body.classList.contains("ready"), null, { timeout: 200000 });
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

    // 디자이너 카드 → 셀링포인트 + 가게 들어가기
    await stop(p, 3);
    await p.waitForSelector("#card.on", { timeout: 20000 }).catch(() => {});
    ok(await p.locator("#card.on .badge").innerText() === "디자이너폰팔이", "디자이너 카드 등장");
    ok(await p.locator("#card .points li").count() === 3, "카드에 셀링포인트 3개");
    ok(await p.locator("#bubble").isVisible(), "말풍선 표시");
    const head = await p.evaluate(() => PP.world().headOnScreen("designer"));
    await p.mouse.move(head.x, head.y + 140); await p.waitForTimeout(200);
    ok(await p.evaluate(() => document.getElementById("world").style.cursor) === "pointer", "캐릭터에 마우스 올리면 클릭 가능 표시");
    if (shots) await p.screenshot({ path: shots + "/desktop-designer.png" });

    const say = async (t) => { await p.click("#shopDlg"); await p.locator("#shopCh .say", { hasText: t }).first().click(); };
    const step = () => p.evaluate(() => PPShop.step());
    const trails = {};
    async function buy(dealer, point, opt = {}) {
      await p.evaluate((d) => { PPShop.close(); }, dealer);
      await stop(p, { designer: 3, quick: 4, price: 5, safe: 6, used: 7, allinone: 8 }[dealer]);
      await p.waitForSelector("#card.on", { timeout: 20000 });
      await p.click("#card .primary");
      ok(await p.locator("#shop").isVisible() && await p.locator("#mission li").count() === 7, `[${dealer}] 가게 열림 · 미션 7칸`);
      await p.click("#shopDlg");
      const tabs = await p.locator("#shopPanel .ctabs button").allInnerTexts();
      ok(tabs.join(",") === "DUO,Pro,일반,Air · SE", `[${dealer}] Apple 카테고리 같음`);
      if (dealer === "used") ok((await p.locator("#shopPanel .ctabs button.on").innerText()) === "Pro" && await p.locator("#shopPanel .pk .ub").count() > 0, "[used] 중고 재고 있는 카테고리로 시작 · 중고 표시");
      ok(await p.locator("#shopPanel .pk.dis").count() === 0 && (await p.locator("#shopPanel .pk .tag em").first().innerText()).startsWith("지원"), `[${dealer}] 진열대 같음 (모든 폰 선택 가능 · 지원금 표시)`);
      await p.locator(opt.modelSel || "#shopPanel .pk").nth(opt.model || 0).click();
      await say("이걸로");
      ok(await step() === "point", `[${dealer}] 폰 → 셀링포인트 단계`);
      await point();
      // 여기부터는 여섯 폰팔이 모두 같은 단계·같은 버튼
      await say("좋아, 다음");
      await say("SKT"); await say("없어 · 최저가");
      await p.click("#shopDlg"); await p.locator("#shopPanel .veh button", { hasText: "넉넉히" }).click();
      await p.waitForFunction(() => PPShop.step() === "quote", null, { timeout: 20000 });
      if (opt.quote) await opt.quote();
      await say("이 방법으로");
      if (opt.cond) await opt.cond();
      await say("좋아");
      ok(await step() === "join", `[${dealer}] 견적 → 멤버십`);
      await p.click("#shopDlg"); await p.locator("#shopPanel .social .k").click();
      await p.waitForFunction(() => PPShop.step() === "agree", null, { timeout: 20000 });
      await say("서명 완료");
      ok(await p.locator("#shopPanel .cl.err").count() > 0, `[${dealer}] 도장 안 찍으면 막힘`);
      for (const c of await p.locator("#shopPanel .cl").all()) await c.click();
      const pad = await p.locator("#signPad").boundingBox();
      await p.mouse.move(pad.x + 20, pad.y + 50); await p.mouse.down(); await p.mouse.move(pad.x + 160, pad.y + 30, { steps: 10 }); await p.mouse.up();
      await say("서명 완료");
      ok(await step() === "ship", `[${dealer}] 계약 → 배송`);
      if (opt.ship) await opt.ship();
      await p.fill("#f_name", "김폰파"); await p.fill("#f_phone", "010-1234-5678");
      if (await p.locator("#f_addr").count()) await p.fill("#f_addr", "서울 중구 세종대로 110");
      await say("주문 내역 확인"); await say("결제하기");
      ok(await step() === "done", `[${dealer}] 결제 → 영수증`);
      trails[dealer] = (await p.evaluate(() => PPShop.trail())).join(" → ");
      return await p.locator("#shopPanel").innerText();
    }

    let rc = await buy("designer", async () => {
      await p.locator("#shopPanel .tok", { hasText: "코발트" }).click();
      await p.locator("#shopPanel .wide").click();
      ok(await p.locator("#studio").evaluate((d) => d.open), "[designer] 폰꾸 3D 작업실 열림");
      await p.locator("#studioBody .opt", { hasText: "오렌지 볼" }).click().catch(async () => { await p.locator("#studioNext").click(); await p.locator("#studioBody .opt", { hasText: "오렌지 볼" }).click(); });
      if (shots) { await p.waitForTimeout(400); await p.screenshot({ path: shots + "/desktop-studio.png" }); }
      await p.keyboard.press("Escape");
      ok((await p.evaluate(() => PPShop.state().deco.keyring)) === "ball", "[designer] 3D에서 고른 키링이 가게로 돌아옴");
    }, { quote: async () => { await p.locator("#shopPanel .way", { hasText: "번호이동" }).first().click(); }, cond: async () => {
      const t = await p.locator("#shopPanel").innerText();
      ok(t.includes("케이스 · 코발트"), "[designer] 폰꾸 비용이 계산서에");
      ok(t.includes("추가지원금") && t.includes("1mm 매장 지원") && (t.includes("공시지원금") || t.includes("선택약정")), "[designer] 각종 지원금 내역 표시");
    } });
    ok(rc.includes("코발트 케이스"), "[designer] 영수증에 폰꾸 세트");

    rc = await buy("quick", async () => { await p.locator("#shopPanel .veh button", { hasText: "방문 수령" }).click(); },
      { ship: async () => { ok(await p.locator("#f_addr").count() === 0, "[quick] 방문 수령 고르면 주소 칸 없음"); } });
    ok(rc.includes("방문 수령"), "[quick] 영수증에 받는 법");

    rc = await buy("price", async () => { await p.locator("#shopPanel .veh button", { hasText: "2년 총액" }).click(); },
      { quote: async () => {
        ok((await p.locator("#shopPanel .tl").first().innerText()).includes("2년 총액 순"), "[price] 견적이 고른 우선순위로 정렬");
        const tot = await p.evaluate(() => PPShop.methods().map((m) => m.grand));
        ok(tot.every((v, i) => !i || tot[i - 1] <= v), "[price] 2년 총액 오름차순");
        if (shots) await p.screenshot({ path: shots + "/desktop-quote.png" });
      }, cond: async () => {
        await p.locator("#shopPanel .coin", { hasText: "36" }).click();
        ok(await p.evaluate(() => PPShop.state().months) === 36, "[price] 할부 동전 36개월");
      } });

    rc = await buy("safe", async () => {
      await p.locator("#shopPanel .veh button", { hasText: "강화 필름" }).click();
      await p.locator("#shopPanel .cl").first().click();
      ok(await p.locator("#shopPanel .cl.on").count() === 1, "[safe] 약속 도장 찍기");
    }, { cond: async () => { const t = await p.locator("#shopPanel").innerText(); ok(t.includes("휴대폰 보험") && !t.includes("강화 필름"), "[safe] 고른 보호 조합만 계산서에"); } });
    ok(rc.includes("강화 케이스 + 휴대폰 보험"), "[safe] 영수증에 보호 조합");

    rc = await buy("used", async () => {
      ok((await p.locator("#shopPanel .way.on").innerText()).includes("배터리"), "[used] 중고 재고가 있으면 중고 한 대가 먼저 골라져 있음");
      await p.locator("#shopPanel .way", { hasText: "배터리" }).first().click();
    }, { modelSel: "#shopPanel .pk:has(.ub)", quote: async () => {
      const t = await p.locator("#shopPanel .ways").innerText();
      ok(t.includes("번호이동") && t.includes("자급제") && t.includes("1mm 중고"), "[used] 견적 목록은 다른 폰팔이와 같음 (3사 + 자급제 + 중고)");
      ok((await p.locator("#shopPanel .way.on").innerText()).includes("1mm 중고"), "[used] ★에서 고른 중고가 견적에서 미리 선택");
    } });
    ok(rc.includes("중고 S급") && rc.includes("4단계 검수"), "[used] 영수증에 검수 내용");

    rc = await buy("allinone", async () => { await p.locator("#shopPanel .veh button", { hasText: "쓰던 폰 정리" }).click(); },
      { cond: async () => { const t = await p.locator("#shopPanel").innerText(); ok(t.includes("개통 대행") && t.includes("쓰던 폰 정리"), "[allinone] 맡긴 일이 계산서에 0원으로"); } });
    ok(rc.includes("개통 대행 · 데이터 옮기기 · 쓰던 폰 정리"), "[allinone] 영수증에 맡긴 일");
    ok(await p.locator("#mission li.skip").count() === 0, "[allinone] 건너뛰는 단계 없음");
    const ids = Object.keys(trails), base = trails.designer;
    ok(ids.length === 6 && ids.every((d) => trails[d] === base), "여섯 폰팔이 모두 같은 구매 단계: " + base + (ids.every((d) => trails[d] === base) ? "" : " | " + ids.map((d) => d + ": " + trails[d]).join(" | ")));
    if (shots) await p.screenshot({ path: shots + "/desktop-receipt.png" });
    // 접는 폰: 접은 상태 / 펼친 상태 3D
    for (const [brand, tab, name] of [["Samsung", "Z폴드", "Galaxy Z Fold8"], ["Samsung", "Z플립", "Galaxy Z Flip8"], ["Apple", "DUO", "iPhone Duo"]]) {
      await p.evaluate(() => PPShop.go("model")); await p.click("#shopDlg");
      await p.locator("#shopPanel .brands button", { hasText: brand }).click();
      await p.locator("#shopPanel .ctabs button", { hasText: tab }).click();
      await p.locator("#shopPanel .pk", { hasText: name }).first().click();
      ok(await p.locator("#pvHost.live canvas").count() === 1 && await p.locator(".foldseg button").count() === 2, `[${name}] 실측 3D + 접기/펼치기 버튼`);
      await p.locator(".foldseg button", { hasText: "접은" }).click();
      await p.waitForFunction(() => PV3D.folded() > .95, null, { timeout: 30000 });
      await p.locator(".foldseg button", { hasText: "펼친" }).click();
      await p.waitForFunction(() => PV3D.folded() < .05, null, { timeout: 30000 });
      ok(true, `[${name}] 접은 상태 ↔ 펼친 상태 전환`);
    }
    await p.click("#shopExit");
    ok(await p.locator("#shop").isHidden(), "가게 닫으면 광장으로");

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
    await p.locator("#studioNext").click();
    await p.locator("#studioBody button", { hasText: "이미지 보기" }).click();
    ok((await p.locator("#sheetBody img").getAttribute("src")).startsWith("data:image/png"), "꾸민 폰 이미지 만들기");
    await p.keyboard.press("Escape");
    await p.locator("#studioBody button", { hasText: "디자이너에게 사러 가기" }).click();
    ok(await p.locator("#shop").isVisible() && await p.evaluate(() => PPShop.state().dealer) === "designer", "작업실 → 디자이너 가게로");
    await p.click("#shopExit");
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
    await stop(p, 4); await p.waitForSelector("#card.on", { timeout: 20000 }); await p.click("#card .primary");
    await p.locator("#shopPanel .pk").first().click(); await p.locator("#shopCh .say.go").click();
    ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), "모바일 가게 가로 스크롤 없음");
    if (shots) { await p.waitForTimeout(500); await p.screenshot({ path: shots + "/mobile-shop-point.png" }); }
    await p.click("#shopExit");
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
    await p.click("#card .primary");
    ok(await p.locator("#shop").isVisible(), "대체 모드에서도 가게 동작");
    await ctx.close(); await b2.close();
  }
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
  process.exit(fails ? 1 : 0);
})();
