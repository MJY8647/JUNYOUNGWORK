// 사이트의 3D(world.js)를 프리비즈로: 시간을 직접 넘기며 한 프레임씩 그려 JPEG로 저장 (UI 없이 캔버스만)
const { chromium } = require("playwright"); const fs = require("fs");
const OUT = process.argv[2], FPS = 24, W = 1024, H = 576;
const CLIPS = [ // [이름, 시작 장면, 끝 장면, 초]
  // 머무는 영상은 1초 앞당겨 6초 렌더 → 인코딩 때 마지막 1초를 처음 1초 앞부분과 겹쳐 이음매 없는 5초 반복으로 만듦
  ["a-idle", 0, 0, 6, -1], ["ab-move", 0, 1, 6, 0], ["b-idle", 1, 1, 6, 5],
];
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
  await p.goto("file:///home/user/JUNYOUNGWORK/phoneparis-world/index.html?shot");
  await p.waitForFunction(() => document.body.classList.contains("ready"), null, { timeout: 120000 });
  await p.evaluate(() => { const w = PP.world(); w.paused = true; w.renderer.setPixelRatio(1); w.resize(); w.setFrameOffset(0, 0); w.offset.x = w.offset.y = 0; });
  // 군중 시간 t: 광장 반복 영상 0초 = 이동 영상 시작(t=0), 이동 영상 끝(t=6) = 하강 반복 영상 0초 → 바꿔 끼울 때 사람 위치가 같음
  for (const [name, s0, s1, sec, t0] of CLIPS) {
    fs.mkdirSync(`${OUT}/${name}`, { recursive: true });
    const N = sec * FPS;
    if (name === "ab-move" || name === "b-idle") await p.evaluate(() => { const L = PP.world().crowd.userData.people; JSON.parse(window.__snap).forEach((q, i) => Object.assign(L[i], q)); });
    for (let k = 0; k < N; k++) {
      // 군중 상태 맞추기: 반복 영상의 0초(원본 1초 지점) = 바로 붙는 이동 영상의 끝/시작과 같은 순간
      if ((name === "a-idle" && k === FPS) || (name === "ab-move" && k === N - FPS)) await p.evaluate(() => { window.__snap = JSON.stringify(PP.world().crowd.userData.people); });
      const s = s0 + (s1 - s0) * (k / (N - 1));
      const url = await p.evaluate(([s, t]) => { const w = PP.world(); w.setProgress(s); w.placeCamera(); w.animate(1 / 24, t); w.renderer.render(w.scene, w.camera); return w.canvas.toDataURL("image/jpeg", .92); }, [s, t0 + k / FPS]);
      fs.writeFileSync(`${OUT}/${name}/f${String(k).padStart(4, "0")}.jpg`, Buffer.from(url.split(",")[1], "base64"));
    }
    console.log(name, N, "frames");
  }
  await b.close();
})();
