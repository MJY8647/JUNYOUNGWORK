// 세로 프리비즈 전체 구간: 장면 n → n+1 (n = 1..8), 구간마다 24fps × 6초, 실사 3D 폰팔이 포함, ?hq (그림자 O, 사람 점·유람선·간판·만화 캐릭터 X)
const { chromium } = require("playwright"); const fs = require("fs");
const OUT = process.argv[2], FPS = 24, SEC = 6, W = 540, H = 960, S = "/tmp/claude-0/-home-user-JUNYOUNGWORK/9d0c8afe-4077-52df-ac93-8a4c66731849/scratchpad/";
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--allow-file-access-from-files"] });
  const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
  await p.goto("file:///home/user/JUNYOUNGWORK/phoneparis-world/index.html?shot&hq");
  await p.waitForFunction(() => document.body.classList.contains("ready"), null, { timeout: 120000 });
  await p.addScriptTag({ path: S + "npm3/node_modules/three/examples/js/loaders/GLTFLoader.js" });
  await p.addScriptTag({ path: "/home/user/JUNYOUNGWORK/phoneparis-world/tools/previz_dealers.js" });
  console.log(await p.evaluate(() => addRealDealers("file:///home/user/JUNYOUNGWORK/phoneparis-world/characters/glb/")));
  await p.evaluate(() => { const w = PP.world(); w.paused = true; w.renderer.setPixelRatio(1); w.resize(); w.setFrameOffset(0, 0); w.offset.x = w.offset.y = 0; });
  const names = await p.evaluate(() => SITE.chapters.map(c => c.id));
  const from = +(process.argv[3] || 1), to = +(process.argv[4] || 8);
  for (let seg = from; seg <= to; seg++) {
    const dir = `${OUT}/${String(seg).padStart(2, "0")}-${names[seg]}-to-${names[seg + 1]}`; fs.mkdirSync(dir, { recursive: true });
    const N = FPS * SEC;
    for (let k = 0; k < N; k++) {
      const s = seg + k / (N - 1);
      const url = await p.evaluate(([s, t]) => { const w = PP.world(); w.setProgress(s); w.placeCamera(); w.animate(1 / 24, t); w.renderer.render(w.scene, w.camera); return w.canvas.toDataURL("image/jpeg", .92); }, [s, seg * SEC + k / FPS]);
      fs.writeFileSync(`${dir}/f${String(k).padStart(4, "0")}.jpg`, Buffer.from(url.split(",")[1], "base64"));
    }
    console.log("segment", seg, names[seg], "->", names[seg + 1], N, "frames");
  }
  await b.close();
})();
