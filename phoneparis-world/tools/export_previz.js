// 사이트 3D 장면을 GLB로 내보내기 + 카메라 경로 JSON (블렌더 등에서 프리비즈로 쓰기용)
const { chromium } = require("playwright"); const fs = require("fs");
const OUT = process.argv[2], NM = "/tmp/claude-0/-home-user-JUNYOUNGWORK/9d0c8afe-4077-52df-ac93-8a4c66731849/scratchpad/npm3/node_modules/three/examples/js/";
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file:///home/user/JUNYOUNGWORK/phoneparis-world/index.html?shot");
  await p.waitForFunction(() => document.body.classList.contains("ready"), null, { timeout: 120000 });
  await p.addScriptTag({ path: NM + "utils/BufferGeometryUtils.js" }); await p.addScriptTag({ path: NM + "exporters/GLTFExporter.js" });
  const res = await p.evaluate(async () => {
    const T = THREE, w = PP.world(); w.paused = true;
    // 카메라 경로: 장면 10개 + 장면 사이 24fps × 6초 프레임별
    const shots = w.shots.map((s, i) => ({ index: i, chapter: SITE.chapters[i].id, pos: s.pos, look: s.look, fov_vertical_deg: s.fov }));
    const frames = []; const N = w.shots.length - 1, F = 144;
    for (let seg = 0; seg < N; seg++) for (let k = 0; k < F; k++) {
      w.setProgress(seg + k / F); w.offset.x = w.offset.y = 0; w.offset.tx = w.offset.ty = 0; w.placeCamera();
      const c = w.camera; frames.push({ seg, frame: k, progress: +(seg + k / F).toFixed(4), pos: c.position.toArray().map(v => +v.toFixed(3)), quat: c.quaternion.toArray().map(v => +v.toFixed(5)), fov: +c.fov.toFixed(3) });
    }
    w.setProgress(0); w.placeCamera();
    // 내보낼 장면: 하늘 빼고, 인스턴스는 한 덩어리로 굽기 (색은 정점 색으로)
    const root = new T.Group(); root.name = "phoneparis_previz";
    const bake = (im) => {
      const geos = []; const m = new T.Matrix4(), col = new T.Color();
      for (let i = 0; i < im.count; i++) {
        im.getMatrixAt(i, m); const g = im.geometry.clone().applyMatrix4(m).toNonIndexed ? im.geometry.clone().applyMatrix4(m) : null; if (!g) continue;
        const gg = g.index ? g.toNonIndexed() : g; gg.deleteAttribute && gg.attributes.uv && gg.deleteAttribute("uv");
        if (im.instanceColor) { im.getColorAt(i, col); } else col.set(1, 1, 1);
        const n = gg.attributes.position.count, arr = new Float32Array(n * 3); for (let v = 0; v < n; v++) { arr[v * 3] = col.r; arr[v * 3 + 1] = col.g; arr[v * 3 + 2] = col.b; }
        gg.setAttribute("color", new T.BufferAttribute(arr, 3)); geos.push(gg);
      }
      if (!geos.length) return null;
      const merged = T.BufferGeometryUtils.mergeBufferGeometries(geos, false);
      const mat = im.material.clone(); mat.vertexColors = true;
      const mesh = new T.Mesh(merged, mat); mesh.name = im.name || "instanced"; return mesh;
    };
    let baked = 0, copied = 0;
    w.scene.updateMatrixWorld(true);
    w.scene.traverse(o => {
      if (!o.isMesh) return;
      if (o.material && o.material.side === T.BackSide && o.geometry.type === "SphereGeometry") return; // 하늘
      if (o.isInstancedMesh) { if (o.count) { const m = bake(o); if (m) { m.applyMatrix4(o.matrixWorld); root.add(m); baked++; } } return; }
      const c = new T.Mesh(o.geometry, o.material); c.name = o.name || o.parent && o.parent.name || "mesh"; o.matrixWorld.decompose(c.position, c.quaternion, c.scale); root.add(c); copied++;
    });
    // 장면 카메라 10개를 카메라 노드로 넣기
    shots.forEach(s => { const cam = new T.PerspectiveCamera(s.fov_vertical_deg, 16 / 9, .3, 3000); cam.name = "shot_" + String(s.index).padStart(2, "0") + "_" + s.chapter; cam.position.fromArray(s.pos); cam.lookAt(new T.Vector3().fromArray(s.look)); root.add(cam); });
    const glb = await new Promise(r => new T.GLTFExporter().parse(root, r, { binary: true, onlyVisible: true }));
    const bytes = new Uint8Array(glb); let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return { glb: btoa(bin), shots, frames, baked, copied };
  });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(OUT + "/phoneparis-previz.glb", Buffer.from(res.glb, "base64"));
  fs.writeFileSync(OUT + "/camera-shots.json", JSON.stringify({ units: "1 unit ≈ 3.6 m (tower 92 units ≈ 330 m)", up: "+Y", shots: res.shots }, null, 1));
  fs.writeFileSync(OUT + "/camera-path-24fps.json", JSON.stringify({ fps: 24, frames_per_segment: 144, note: "segment n = shot n → shot n+1, quaternion xyzw, vertical fov (deg) at 16:9; portrait site view widens fov ×1.32 (max 80)", frames: res.frames }));
  console.log("baked", res.baked, "copied", res.copied, "frames", res.frames.length, "errors:", errs.join(" | "));
  await b.close();
})();
