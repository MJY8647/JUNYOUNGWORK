import * as THREE from 'three';
import { toon, mesh, rbox, instanced, createLoop, createRenderer, disposeScene } from './toon.js';
import { C, rng, person, animatePerson, buildShop } from './parts.js';

// 작은 행성 위의 휴대폰 쇼핑 마을.
// 북극: 광장과 분수 → 순환 도로(횡단보도·신호등·육교·버스정류장) → 적도 부근 가게 5곳
// → 남반구: 숲, 연못, 통신탑 언덕.
// 모든 물체는 행성 표면의 한 점(방향 벡터)과 그 점의 접평면 기준 앞 방향으로 배치한다.

const RP = 32;                       // 행성 반지름
const DEG = Math.PI / 180;
const ROAD_LAT = 42 * DEG, ROAD_HALF = 2.6; // 도로 중심 위도, 반폭(표면 거리)
const SHOP_LAT = 12 * DEG;
const PLAYER_R = 0.45, SPEED = 5.4, JUMP_V = 7, GRAVITY = -20;
const BRIDGE = { half: 9, deck: 4.5, width: 1.8, h: 3.4 };
const SAVE_KEY = 'planet-pos-v1';
const UP = new THREE.Vector3(0, 1, 0);

// ---------- 구면 좌표 도우미 ----------
const dirLL = (lat, lon) => new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon));
const latOf = (d) => Math.asin(THREE.MathUtils.clamp(d.y / d.length(), -1, 1));
const lonOf = (d) => Math.atan2(d.z, d.x);
const tangent = (n, v) => v.clone().addScaledVector(n, -n.dot(v)).normalize();
function northAt(n) {
  const t = UP.clone().addScaledVector(n, -n.y);
  return t.lengthSq() < 1e-6 ? new THREE.Vector3(1, 0, 0) : t.normalize();
}
const basis = new THREE.Matrix4(), xAxis = new THREE.Vector3();
function orient(obj, n, fwd) {
  xAxis.crossVectors(n, fwd).normalize();
  basis.makeBasis(xAxis, n, fwd);
  obj.quaternion.setFromRotationMatrix(basis);
}
function place(obj, n, h, fwd) {
  obj.position.copy(n).multiplyScalar(RP + h);
  orient(obj, n, fwd);
  return obj;
}
// 표면에서 n 기준으로 앞(fwd)·오른쪽 방향으로 거리만큼 이동한 지점의 방향
function offsetDir(n, fwd, along, side = 0) {
  const right = new THREE.Vector3().crossVectors(fwd, n);
  return n.clone().multiplyScalar(RP).addScaledVector(fwd, along).addScaledVector(right, side).normalize();
}
const tmpObj = new THREE.Object3D();
function matrixAt(n, h, fwd, sx = 1, sy = 1, sz = 1) {
  place(tmpObj, n, h, fwd);
  tmpObj.scale.set(sx, sy, sz);
  tmpObj.updateMatrix();
  return tmpObj.matrix.clone();
}
// 표면을 따라 휘는 띠(길·인도)
function surfaceStrip(dirs, width, color, lift = 0.03) {
  const pos = [], idx = [];
  dirs.forEach((d, i) => {
    const next = dirs[Math.min(i + 1, dirs.length - 1)], prev = dirs[Math.max(i - 1, 0)];
    const along = tangent(d, next.clone().sub(prev));
    const side = new THREE.Vector3().crossVectors(along, d).normalize().multiplyScalar(width / 2);
    const c = d.clone().multiplyScalar(RP);
    [1, -1].forEach((s) => { const p = c.clone().addScaledVector(side, s).normalize().multiplyScalar(RP + lift); pos.push(p.x, p.y, p.z); });
    if (i < dirs.length - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, toon(color, { side: THREE.DoubleSide }));
  m.receiveShadow = true;
  return m;
}
const arc = (a, b, steps) => Array.from({ length: steps + 1 }, (_, i) => new THREE.Vector3().copy(a).lerp(b, i / steps).normalize());
// 표면에 얹는 원형 덮개 (광장·연못)
function cap(n, angle, color, lift) {
  const g = new THREE.SphereGeometry(RP + lift, 48, 6, 0, Math.PI * 2, 0, angle);
  const m = new THREE.Mesh(g, typeof color === 'string' ? toon(color) : color);
  m.quaternion.setFromUnitVectors(UP, n);
  m.receiveShadow = true;
  return m;
}

function car(color) {
  const g = new THREE.Group();
  const body = mesh(rbox(1.7, 0.7, 3.2, 0.25), toon(color), { thickness: 0.03 });
  body.position.y = 0.65;
  const cabin = mesh(rbox(1.45, 0.6, 1.7, 0.22), toon('#f4f7fb'), { thickness: 0.03 });
  cabin.position.set(0, 1.25, -0.2);
  const glass = mesh(rbox(1.5, 0.36, 1.3, 0.12), toon('#8fc9e6'), { thickness: 0.01, cast: false });
  glass.position.set(0, 1.3, -0.15);
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.28, 14).rotateZ(Math.PI / 2);
  const wheelMat = toon('#2b2a30');
  [[-0.8, 1.0], [0.8, 1.0], [-0.8, -1.0], [0.8, -1.0]].forEach(([x, z]) => {
    const w = mesh(wheelGeo, wheelMat, { thickness: 0.02 });
    w.position.set(x, 0.34, z);
    g.add(w);
  });
  const lamp = new THREE.MeshBasicMaterial({ color: '#fff6c8' });
  [-0.55, 0.55].forEach((x) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), lamp); l.position.set(x, 0.75, 1.6); g.add(l); });
  g.add(body, cabin, glass);
  return g;
}

function trafficLight() {
  const g = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.08, 0.1, 3, 8), toon('#4a4f5a'), { thickness: 0.02 });
  pole.position.y = 1.5;
  const box = mesh(rbox(0.45, 0.95, 0.4, 0.08), toon('#2f333b'), { thickness: 0.02 });
  box.position.y = 3.1;
  const red = new THREE.MeshBasicMaterial({ color: '#ff5a4a' });
  const green = new THREE.MeshBasicMaterial({ color: '#4ade80' });
  const r = new THREE.Mesh(new THREE.CircleGeometry(0.13, 14), red); r.position.set(0, 3.32, 0.21);
  const gr = new THREE.Mesh(new THREE.CircleGeometry(0.13, 14), green); gr.position.set(0, 2.9, 0.21);
  g.add(pole, box, r, gr);
  g.userData = { red, green };
  return g;
}

export function createPlanet({ canvas, overlay, shops, onNear, onZone, onEnterShop }) {
  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  const mobile = matchMedia('(max-width: 760px)').matches;
  const rand = rng(11);

  const hemi = new THREE.HemisphereLight('#fff6e6', '#9cc7a0', 1.5);
  const sun = new THREE.DirectionalLight('#fff1dc', 2.3);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(1024);
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 70 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  scene.add(hemi, sun, sun.target);

  // ---------- 행성 ----------
  const ground = mesh(new THREE.SphereGeometry(RP, 96, 64), toon(C.grass), { thickness: 0.12, cast: false });
  scene.add(ground);
  const pole = new THREE.Vector3(0, 1, 0);
  scene.add(cap(pole, 13 * DEG, C.stone, 0.02), cap(pole, 13.8 * DEG, C.stoneDark, 0.015));

  const colliders = { circles: [], boxes: [] };
  const addCircle = (n, r) => colliders.circles.push({ c: n.clone().multiplyScalar(RP), r });

  // 분수
  const fountain = new THREE.Group();
  const basin = mesh(new THREE.CylinderGeometry(1.9, 2.0, 0.55, 32), toon('#d8c6a8'), { thickness: 0.04 }); basin.position.y = 0.27;
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.65, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#7cc9e6' })); pool.position.y = 0.5;
  const column = mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.3, 16), toon('#d8c6a8'), { thickness: 0.03 }); column.position.y = 0.9;
  const bowl = mesh(new THREE.CylinderGeometry(0.75, 0.35, 0.3, 24), toon('#d8c6a8'), { thickness: 0.03 }); bowl.position.y = 1.6;
  const spout = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 10), new THREE.MeshBasicMaterial({ color: '#bfe9f7', transparent: true, opacity: 0.85 }));
  spout.position.y = 1.85; spout.scale.set(1, 0.55, 1);
  fountain.add(basin, pool, column, bowl, spout);
  place(fountain, pole, 0, new THREE.Vector3(0, 0, 1));
  scene.add(fountain);
  addCircle(pole, 2.05);

  // 광장 벤치
  for (let i = 0; i < 6; i++) {
    const lon = (i / 6) * Math.PI * 2 + 0.3;
    const n = dirLL(90 * DEG - 4.8 / RP, lon);
    const b = mesh(rbox(1.6, 0.14, 0.55, 0.05), toon('#b9764b'), { thickness: 0.025 });
    const legs = mesh(rbox(1.3, 0.45, 0.4, 0.05), toon('#8d5634'), { thickness: 0.02 }); legs.position.y = -0.27;
    b.add(legs);
    place(b, n, 0.5, northAt(n));
    scene.add(b);
  }

  // ---------- 순환 도로 ----------
  const ringDirs = (lat, steps = 160) => Array.from({ length: steps + 1 }, (_, i) => dirLL(lat, (i / steps) * Math.PI * 2));
  scene.add(surfaceStrip(ringDirs(ROAD_LAT), ROAD_HALF * 2, '#5b5f6b', 0.03));
  scene.add(surfaceStrip(ringDirs(ROAD_LAT + (ROAD_HALF + 0.4) / RP), 0.8, '#d9d2c4', 0.045));
  scene.add(surfaceStrip(ringDirs(ROAD_LAT - (ROAD_HALF + 0.4) / RP), 0.8, '#d9d2c4', 0.045));
  const dashMx = [];
  for (let i = 0; i < 64; i++) {
    const lon = (i / 64) * Math.PI * 2, n = dirLL(ROAD_LAT, lon);
    dashMx.push(matrixAt(n, 0.05, new THREE.Vector3(-Math.sin(lon), 0, Math.cos(lon)), 0.18, 0.02, 1.2));
  }
  scene.add(instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#ffd66b' }), dashMx, { outline: false, cast: false }));

  // 보행 순환로: 도로 안쪽(62°)과 가게 앞(24°)
  const WALK_N = 62 * DEG, WALK_S = 24 * DEG;
  scene.add(surfaceStrip(ringDirs(WALK_N), 2.0, C.stone, 0.035), surfaceStrip(ringDirs(WALK_S), 2.0, C.stone, 0.035));

  // ---------- 가게 · 길 · 횡단보도 ----------
  const zones = [];
  const lights = [];
  const stripeMx = [];
  const shopObjs = shops.map((s, i) => {
    const lon = (i / shops.length) * Math.PI * 2 + 0.25;
    const n = dirLL(SHOP_LAT, lon);
    const fwd = northAt(n);
    const { group, W, D } = buildShop(s);
    place(group, n, 0, fwd);
    scene.add(group);
    colliders.boxes.push({ c: n.clone().multiplyScalar(RP), fwd, right: new THREE.Vector3().crossVectors(fwd, n), hw: W / 2 + 0.1, hd: D / 2 + 0.1 });
    const door = offsetDir(n, fwd, D / 2 + 1.7);
    const npc = person({ body: s.color });
    const npcDir = offsetDir(n, fwd, D / 2 + 0.9, 2.1);
    place(npc, npcDir, 0, northAt(npcDir));
    scene.add(npc);
    addCircle(npcDir, 0.45);
    // 광장 → 도로, 도로 → 가게 문 앞까지 길
    const plazaEdge = dirLL(77 * DEG, lon), roadN = dirLL(ROAD_LAT + (ROAD_HALF + 0.2) / RP, lon), roadS = dirLL(ROAD_LAT - (ROAD_HALF + 0.2) / RP, lon);
    scene.add(surfaceStrip(arc(plazaEdge, roadN, 24), 2.4, C.stone, 0.035));
    scene.add(surfaceStrip(arc(roadS, door, 24), 2.4, C.stone, 0.035));
    // 횡단보도 줄무늬
    for (let k = -2; k <= 2; k++) {
      const d = offsetDir(dirLL(ROAD_LAT, lon), northAt(dirLL(ROAD_LAT, lon)), 0, k * 0.5);
      stripeMx.push(matrixAt(d, 0.045, northAt(d), 0.3, 0.02, ROAD_HALF * 2 - 0.4));
    }
    // 신호등
    [[ROAD_LAT + (ROAD_HALF + 0.9) / RP, 1.7], [ROAD_LAT - (ROAD_HALF + 0.9) / RP, -1.7]].forEach(([lat, side], k) => {
      const base = dirLL(lat, lon);
      const ld = offsetDir(base, northAt(base), 0, side);
      const tl = trafficLight();
      place(tl, ld, 0, k === 0 ? northAt(ld).negate() : northAt(ld));
      scene.add(tl);
      lights.push(tl);
      addCircle(ld, 0.25);
    });
    zones.push({ name: s.name, color: s.color, c: n.clone().multiplyScalar(RP), r: 10, shop: s });
    return { shop: s, n, lon, fwd, door, npc, group, doorP: door.clone().multiplyScalar(RP), tagP: n.clone().multiplyScalar(RP + 6.6), npcFwd: northAt(npcDir), turned: false };
  });
  scene.add(instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#f5f5f5' }), stripeMx, { outline: false, cast: false }));

  // 가로등 (도로 양옆)
  {
    const postMx = [], bulbMx = [];
    for (let i = 0; i < 20; i++) {
      const lon = (i / 20) * Math.PI * 2 + 0.25 + Math.PI / 20;
      [1, -1].forEach((sgn) => {
        const n = dirLL(ROAD_LAT + sgn * (ROAD_HALF + 1.3) / RP, lon);
        postMx.push(matrixAt(n, 1.4, northAt(n)));
        bulbMx.push(matrixAt(n, 2.9, northAt(n)));
        addCircle(n, 0.2);
      });
    }
    scene.add(instanced(new THREE.CylinderGeometry(0.08, 0.1, 2.8, 8), toon('#5a4a42'), postMx, { thickness: 0.02 }));
    scene.add(instanced(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshBasicMaterial({ color: '#fff1b8' }), bulbMx, { outline: false, cast: false }));
  }

  // ---------- 육교 ----------
  const bridgeLon = shopObjs[0].lon + Math.PI / shops.length; // 첫 두 가게 사이
  const bridgeC = dirLL(ROAD_LAT, bridgeLon);
  const bridgeF = northAt(bridgeC);
  const bridgeR = new THREE.Vector3().crossVectors(bridgeF, bridgeC);
  const profile = (s) => { const a = Math.abs(s); return a <= BRIDGE.deck ? BRIDGE.h : a >= BRIDGE.half ? 0 : BRIDGE.h * (BRIDGE.half - a) / (BRIDGE.half - BRIDGE.deck); };
  {
    const stepMx = [], deckMx = [], postMx = [], railMx = [];
    const stepLen = 0.5;
    for (let s = -BRIDGE.half + stepLen / 2; s < BRIDGE.half; s += stepLen) {
      const d = offsetDir(bridgeC, bridgeF, s);
      const f = northAt(d);
      const hgt = profile(s);
      if (Math.abs(s) > BRIDGE.deck) stepMx.push(matrixAt(d, hgt / 2, f, BRIDGE.width, Math.max(0.1, hgt), stepLen + 0.02));
      else deckMx.push(matrixAt(d, hgt - 0.15, f, BRIDGE.width + 0.2, 0.3, stepLen + 0.02));
      [-1, 1].forEach((side) => {
        const rd = offsetDir(bridgeC, bridgeF, s, side * (BRIDGE.width / 2 + 0.05));
        if (Math.round(s / stepLen) % 2 === 0) postMx.push(matrixAt(rd, hgt + 0.45, northAt(rd), 0.08, 0.9, 0.08));
        railMx.push(matrixAt(rd, hgt + 0.9, northAt(rd), 0.12, 0.1, stepLen + 0.05));
      });
    }
    scene.add(instanced(new THREE.BoxGeometry(1, 1, 1), toon('#e9dcc6'), stepMx, { thickness: 0.02 }));
    scene.add(instanced(new THREE.BoxGeometry(1, 1, 1), toon('#7fb3d5'), deckMx, { thickness: 0.02 }));
    scene.add(instanced(new THREE.BoxGeometry(1, 1, 1), toon('#3d6f99'), postMx, { outline: false }));
    scene.add(instanced(new THREE.BoxGeometry(1, 1, 1), toon('#ff7a59'), railMx, { thickness: 0.015 }));
    // 기둥
    [-1, 1].forEach((sa) => [-1, 1].forEach((sw) => {
      const d = offsetDir(bridgeC, bridgeF, sa * (BRIDGE.deck - 0.3), sw * (BRIDGE.width / 2 - 0.2));
      const p = mesh(new THREE.CylinderGeometry(0.18, 0.2, BRIDGE.h - 0.3, 10), toon('#d7cbb6'), { thickness: 0.02 });
      p.position.y = (BRIDGE.h - 0.3) / 2;
      const g = new THREE.Group(); g.add(p);
      place(g, d, 0, northAt(d));
      scene.add(g);
      addCircle(d, 0.25);
    }));
    // 육교 이름판
    const signC = document.createElement('canvas'); signC.width = 256; signC.height = 64;
    const sg = signC.getContext('2d');
    sg.fillStyle = '#3d6f99'; sg.beginPath(); sg.roundRect(0, 0, 256, 64, 14); sg.fill();
    sg.fillStyle = '#fff'; sg.font = 'bold 34px "Jua", sans-serif'; sg.textAlign = 'center'; sg.textBaseline = 'middle'; sg.fillText('무지개 육교', 128, 34);
    const tex = new THREE.CanvasTexture(signC); tex.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    sign.position.set(0, BRIDGE.h + 0.1, 0);
    sign.rotation.y = Math.PI / 2;
    const sg2 = new THREE.Group(); sg2.add(sign);
    place(sg2, offsetDir(bridgeC, bridgeF, 0, BRIDGE.width / 2 + 0.2), 0, bridgeF);
    scene.add(sg2);
    zones.push({ name: '무지개 육교', color: '#3d6f99', c: bridgeC.clone().multiplyScalar(RP), r: 6 });
  }
  const bridgeP = bridgeC.clone().multiplyScalar(RP), bd = new THREE.Vector3(), bl = { s: 0, w: 0 };
  const bridgeLocal = (p) => {
    bd.copy(p).sub(bridgeP);
    bl.s = bd.dot(bridgeF); bl.w = bd.dot(bridgeR);
    return bl;
  };

  // ---------- 버스정류장 ----------
  {
    const lon = shopObjs[2].lon + Math.PI / shops.length;
    const n = dirLL(ROAD_LAT - (ROAD_HALF + 1.6) / RP, lon);
    const g = new THREE.Group();
    const roof = mesh(rbox(3.4, 0.16, 1.4, 0.06), toon('#ef9a2d'), { thickness: 0.02 }); roof.position.y = 2.4;
    const back = mesh(rbox(3.2, 1.7, 0.1, 0.04), toon('#bfe8f7', { transparent: true, opacity: 0.7 }), { thickness: 0.015 }); back.position.set(0, 1.35, -0.6);
    const bench = mesh(rbox(2.4, 0.12, 0.5, 0.04), toon('#b9764b'), { thickness: 0.02 }); bench.position.set(0, 0.5, -0.3);
    [-1.5, 1.5].forEach((x) => { const p = mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), toon('#4a4f5a'), { thickness: 0.015 }); p.position.set(x, 1.2, 0.55); g.add(p); });
    g.add(roof, back, bench);
    place(g, n, 0, northAt(n));
    scene.add(g);
    colliders.boxes.push({ c: n.clone().multiplyScalar(RP), fwd: northAt(n), right: new THREE.Vector3().crossVectors(northAt(n), n), hw: 1.7, hd: 0.3 });
    zones.push({ name: '버스정류장', color: '#ef9a2d', c: n.clone().multiplyScalar(RP), r: 4 });
  }

  // ---------- 남반구: 통신탑 언덕, 연못, 언덕 ----------
  const south = new THREE.Vector3(0, -1, 0);
  let beacon_;
  {
    const hill = mesh(new THREE.SphereGeometry(6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), toon(C.grassDark), { thickness: 0.06 });
    hill.scale.set(1, 0.45, 1);
    const g = new THREE.Group(); g.add(hill);
    const tower = new THREE.Group();
    const mast = mesh(new THREE.CylinderGeometry(0.25, 0.9, 12, 6), toon('#f2f2f2'), { thickness: 0.04 }); mast.position.y = 6;
    [2.5, 5.5, 8.5].forEach((y, i) => { const r = mesh(new THREE.TorusGeometry(0.75 - i * 0.18, 0.12, 6, 18).rotateX(Math.PI / 2), toon('#ff5a4a'), { thickness: 0.02 }); r.position.y = y; tower.add(r); });
    const dish = mesh(new THREE.SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3), toon('#e8eef5', { side: THREE.DoubleSide }), { thickness: 0.02 });
    dish.position.set(0.5, 9.5, 0); dish.rotation.z = -1.2;
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff3b30' }));
    beacon.position.y = 12.2;
    tower.add(mast, dish, beacon);
    tower.position.y = 2.6;
    g.add(tower);
    g.userData.beacon = beacon;
    place(g, south, 0, new THREE.Vector3(0, 0, 1));
    scene.add(g);
    addCircle(south, 5.6);
    zones.push({ name: '통신탑 언덕', color: '#ff5a4a', c: south.clone().multiplyScalar(RP), r: 11 });
    beacon_ = beacon;
  }
  const pondN = dirLL(-35 * DEG, 1.1);
  scene.add(cap(pondN, 5 / RP, new THREE.MeshBasicMaterial({ color: '#7cc9e6' }), 0.04), cap(pondN, 5.6 / RP, C.sand, 0.03));
  addCircle(pondN, 5.3);
  zones.push({ name: '반짝 연못', color: '#3aa7d8', c: pondN.clone().multiplyScalar(RP), r: 8 });
  [[-30 * DEG, 3.0, 4], [-55 * DEG, 4.4, 3.4], [-20 * DEG, 5.3, 3]].forEach(([lat, lon, r]) => {
    const n = dirLL(lat, lon);
    const h = mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(C.grassDark), { thickness: 0.05 });
    h.scale.y = 0.4;
    const g = new THREE.Group(); g.add(h);
    place(g, n, -0.1, northAt(n));
    scene.add(g);
    addCircle(n, r - 0.4);
  });

  // ---------- 나무 · 바위 · 꽃 ----------
  const nearRoute = (n) => {
    const lat = latOf(n);
    if (lat > 75 * DEG) return true; // 광장
    if (Math.abs(lat - ROAD_LAT) * RP < ROAD_HALF + 2.2) return true; // 도로
    if (Math.abs(lat - WALK_N) * RP < 2 || Math.abs(lat - WALK_S) * RP < 2) return true; // 보행로
    const lon = lonOf(n);
    return shopObjs.some((s) => {
      let dl = lon - s.lon; dl = Math.atan2(Math.sin(dl), Math.cos(dl));
      const across = Math.abs(dl) * Math.cos(lat) * RP;
      return (lat > SHOP_LAT - 4 * DEG && across < 2.6) || n.distanceTo(s.n) * RP < 6.2;
    }) || bridgeLocal(n.clone().multiplyScalar(RP)).s ** 2 + bridgeLocal(n.clone().multiplyScalar(RP)).w ** 2 < 100;
  };
  const clearOf = (n, pad) => colliders.circles.every(({ c, r }) => c.distanceTo(n.clone().multiplyScalar(RP)) > r + pad)
    && colliders.boxes.every(({ c, hw, hd }) => c.distanceTo(n.clone().multiplyScalar(RP)) > Math.max(hw, hd) + pad);
  const trunkMx = [], leafMx = [[], [], []], rockMx = [];
  const total = mobile ? 110 : 150;
  for (let tries = 0, k = 0; k < total && tries < 6000; tries++) {
    const n = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
    if (nearRoute(n) || !clearOf(n, 1.4)) continue;
    const s = 0.8 + rand() * 0.7;
    const f = northAt(n);
    trunkMx.push(matrixAt(n, 0.55 * s, f, s, s, s));
    leafMx[k % 3].push(matrixAt(n, 1.75 * s, f.clone().applyAxisAngle(n, rand() * 6), s, s * 1.1, s));
    addCircle(n, 0.5 * s);
    k++;
  }
  for (let i = 0; i < 24; i++) {
    const n = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
    if (nearRoute(n) || !clearOf(n, 0.8)) continue;
    const s = 0.4 + rand() * 0.6;
    rockMx.push(matrixAt(n, 0.15, northAt(n), s * 1.3, s * 0.8, s));
    addCircle(n, s * 0.6);
  }
  scene.add(instanced(new THREE.CylinderGeometry(0.16, 0.22, 1.1, 8), toon(C.trunk), trunkMx, { thickness: 0.03 }));
  leafMx.forEach((mx, i) => scene.add(instanced(new THREE.IcosahedronGeometry(1.0, 1), toon(C.leaf[i]), mx, { thickness: 0.04 })));
  scene.add(instanced(new THREE.DodecahedronGeometry(0.8, 0), toon('#b8b2a7'), rockMx, { thickness: 0.03 }));
  ['#ff8fa3', '#ffd66b', '#ffffff', '#b9a7f0'].forEach((col) => {
    const mx = [];
    for (let i = 0; i < 90; i++) {
      const n = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      if (nearRoute(n)) continue;
      mx.push(matrixAt(n, 0.12, northAt(n), 0.7 + rand() * 0.5, 0.7, 0.7));
    }
    scene.add(instanced(new THREE.OctahedronGeometry(0.14, 0), new THREE.MeshBasicMaterial({ color: col }), mx, { outline: false, cast: false }));
  });

  // ---------- 구름 ----------
  const clouds = new THREE.Group();
  {
    const puffMx = [], m = new THREE.Matrix4(), off = new THREE.Matrix4();
    for (let i = 0; i < 12; i++) {
      const n = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      m.copy(matrixAt(n, 12 + rand() * 4, northAt(n)));
      for (let j = 0; j < 4; j++) {
        const r = 1 + rand() * 0.8;
        off.compose(new THREE.Vector3(j * 1.2 - 1.8, rand() * 0.5, rand() * 0.6), new THREE.Quaternion(), new THREE.Vector3(r, r, r));
        puffMx.push(m.clone().multiply(off));
      }
    }
    clouds.add(instanced(new THREE.IcosahedronGeometry(1, 1), toon('#ffffff'), puffMx, { thickness: 0.05, cast: false }));
  }
  scene.add(clouds);

  // ---------- 자동차 ----------
  const cars = ['#ff6b6b', '#4f8ef7', '#ffd166', '#06d6a0', '#c77dff'].map((col, i) => {
    const g = car(col);
    scene.add(g);
    const lane = i % 2 === 0 ? 1 : -1; // 1: 동쪽으로, -1: 서쪽으로
    return { g, lane, lon: rand() * Math.PI * 2, v: 0, lat: ROAD_LAT + lane * -1.2 / RP };
  });

  // ---------- 산책하는 주민 ----------
  const walkers = [
    { lat: 70 * DEG, lon: 0, dir: 1, body: '#e76f51' },
    { lat: 70 * DEG, lon: 3, dir: -1, body: '#2a9d8f' },
    { lat: 26 * DEG, lon: 1.5, dir: 1, body: '#8f6fd8' },
    { lat: -15 * DEG, lon: 4.5, dir: -1, body: '#f4a261' },
  ].map((w) => { const g = person({ body: w.body }); scene.add(g); return { ...w, g }; });

  // ---------- 플레이어 ----------
  const player = person({ body: '#ff7a59', cap: '#3a6fd8', pack: '#59c3a6' });
  const xray = new THREE.MeshBasicMaterial({ color: '#3a2a24', transparent: true, opacity: 0.45, depthWrite: false, depthFunc: THREE.GreaterDepth });
  const bodies = [];
  player.traverse((o) => { if (o.isMesh && o.material.isMeshToonMaterial) bodies.push(o); });
  bodies.forEach((o) => {
    const x = new THREE.Mesh(o.geometry, xray); x.renderOrder = 10; x.raycast = () => {}; o.add(x);
    o.material.transparent = true; o.renderOrder = 20;
    o.children.forEach((c) => { if (c !== x) { c.material = c.material.clone(); c.material.transparent = true; c.renderOrder = 20; } });
  });
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.14, depthWrite: false }));
  scene.add(player, blob);

  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(SAVE_KEY)); } catch { /* 저장소 사용 불가 */ }
  const pos = saved ? new THREE.Vector3(...saved.p) : dirLL(80 * DEG, Math.PI / 2).multiplyScalar(RP);
  let facing = saved ? new THREE.Vector3(...saved.f) : northAt(pos.clone().normalize()).negate();
  let camFwd = saved ? new THREE.Vector3(...saved.c) : facing.clone();
  let sunRef = camFwd.clone();
  let h = 0, vy = 0, onBridge = false;
  let camDist = mobile ? 13 : 11, camPitch = 0.62;

  const marker = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.45, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  scene.add(marker);

  // ---------- 입력 ----------
  const keys = new Set();
  let route = [], inputOn = true, stuck = 0, lastDrag = -10, nowT = 0;
  const onKey = (e) => {
    if (!inputOn || e.target.closest?.('input, select, textarea')) return;
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      if (e.type === 'keydown') { keys.add(k); route = []; e.preventDefault(); } else keys.delete(k);
    }
    if (k === ' ' && e.type === 'keydown' && e.target === document.body) { e.preventDefault(); jump(); }
  };
  const clearKeys = () => keys.clear();
  addEventListener('keydown', onKey);
  addEventListener('keyup', onKey);
  addEventListener('blur', clearKeys);

  // 드래그 = 시점 회전, 핀치·휠 = 확대, 탭 = 그 지점으로 이동
  const pointers = new Map();
  let dragMoved = 0, pinch0 = 0, dist0 = camDist;
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragMoved = 0;
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); dist0 = camDist; }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      camDist = THREE.MathUtils.clamp(dist0 * pinch0 / Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), 6, 22);
      dragMoved = 99;
      return;
    }
    dragMoved += Math.abs(dx) + Math.abs(dy);
    if (dragMoved > 6) {
      const n = pos.clone().normalize();
      camFwd.applyAxisAngle(n, -dx * 0.007);
      camPitch = THREE.MathUtils.clamp(camPitch + dy * 0.004, 0.12, 1.25);
      lastDrag = nowT;
    }
  });
  const endPointer = (e) => {
    const wasTap = pointers.size === 1 && dragMoved <= 6;
    pointers.delete(e.pointerId);
    if (wasTap && inputOn && e.type === 'pointerup') tapAt(e);
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); camDist = THREE.MathUtils.clamp(camDist * (1 + e.deltaY * 0.001), 6, 22); }, { passive: false });

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function tapAt(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hitShop = shopObjs.find((s) => ray.intersectObject(s.group, true).length);
    if (hitShop) { walkTo(hitShop.shop.id); return; }
    const hit = ray.ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(), RP), new THREE.Vector3());
    if (!hit) return;
    route = withDetour(pos, hit).concat([hit.clone()]);
    const n = hit.clone().normalize();
    place(marker, n, 0.06, northAt(n));
    marker.rotateX(-Math.PI / 2);
    marker.material.opacity = 0.9;
  }

  // 분수를 가로지르면 옆으로 돌아간다
  function withDetour(a, b) {
    const pts = arc(a.clone().normalize(), b.clone().normalize(), 12);
    const near = pts.find((p) => p.angleTo(pole) < 4.5 / RP);
    if (!near) return [];
    const lon = lonOf(near.lengthSq() ? near : a);
    return [dirLL(90 * DEG - 5 / RP, lon + 0.6).multiplyScalar(RP)];
  }

  // 가게까지: (광장 쪽이면) 광장 순환 → 가게 앞 길 → 횡단보도 → 문
  function walkTo(id) {
    const s = shopObjs.find((o) => o.shop.id === id);
    if (!s) return;
    route = [];
    const n = pos.clone().normalize();
    const lat = latOf(n), lon = lonOf(n);
    let dl = s.lon - lon; dl = Math.atan2(Math.sin(dl), Math.cos(dl));
    const ringLat = lat > ROAD_LAT ? WALK_N : WALK_S;
    const onOwnPath = Math.abs(dl) * Math.cos(lat) * RP < 1.5;
    if (!onOwnPath) {
      const steps = Math.max(1, Math.ceil(Math.abs(dl) / 0.35));
      for (let i = 0; i <= steps; i++) route.push(dirLL(ringLat, lon + (dl * i) / steps).multiplyScalar(RP));
    }
    if (lat > ROAD_LAT || (onOwnPath && lat > ROAD_LAT - 0.02)) {
      route.push(dirLL(ROAD_LAT + (ROAD_HALF + 1) / RP, s.lon).multiplyScalar(RP));
      route.push(dirLL(ROAD_LAT - (ROAD_HALF + 1) / RP, s.lon).multiplyScalar(RP));
    }
    route.push(s.door.clone().multiplyScalar(RP));
  }

  function jump() { if (h <= groundH() + 0.01) vy = JUMP_V; }
  const groundH = () => (onBridge ? profile(bridgeLocal(pos).s) : 0);

  // ---------- 충돌 ----------
  const rn = new THREE.Vector3(), rd = new THREE.Vector3();
  function resolve(p) {
    const n = rn.copy(p).normalize();
    for (const { c, r } of colliders.circles) {
      const min = r + PLAYER_R;
      if (Math.abs(p.x - c.x) > min + 1 || Math.abs(p.y - c.y) > min + 1 || Math.abs(p.z - c.z) > min + 1) continue; // 먼 것은 건너뜀
      const d = rd.copy(p).sub(c); d.addScaledVector(n, -n.dot(d));
      const len = d.length();
      if (len < min && len > 1e-4) p.addScaledVector(d, (min - len) / len);
    }
    for (const b of colliders.boxes) {
      if (p.distanceToSquared(b.c) > 64) continue;
      const d = rd.copy(p).sub(b.c);
      const lx = d.dot(b.right), lz = d.dot(b.fwd);
      const ox = b.hw + PLAYER_R - Math.abs(lx), oz = b.hd + PLAYER_R - Math.abs(lz);
      if (ox > 0 && oz > 0 && Math.abs(d.dot(n)) < 4) {
        if (ox < oz) p.addScaledVector(b.right, Math.sign(lx) * ox); else p.addScaledVector(b.fwd, Math.sign(lz) * oz);
      }
    }
    p.normalize().multiplyScalar(RP);
  }

  // ---------- HTML 오버레이 ----------
  const bubble = document.createElement('div');
  bubble.className = 'npc-bubble';
  bubble.setAttribute('aria-live', 'polite');
  overlay.appendChild(bubble);
  const tags = shopObjs.map((s) => {
    const t = document.createElement('button');
    t.type = 'button'; t.className = 'shop-tag'; t.textContent = s.shop.name;
    t.style.setProperty('--c', s.shop.color);
    t.addEventListener('click', () => walkTo(s.shop.id));
    overlay.appendChild(t);
    return t;
  });
  let talkShop = null, typed = 0, nearId = null, zoneName = null;
  const planetSphere = new THREE.Sphere(new THREE.Vector3(), RP * 0.985);
  const occRay = new THREE.Ray(), occHit = new THREE.Vector3();
  const hiddenByPlanet = (pt) => {
    occRay.origin.copy(camera.position);
    occRay.direction.copy(pt).sub(camera.position);
    const len = occRay.direction.length();
    occRay.direction.divideScalar(len);
    return !!occRay.intersectSphere(planetSphere, occHit) && occHit.distanceTo(camera.position) < len;
  };

  // ---------- 카메라 ----------
  // 캔버스 크기는 리사이즈 때만 읽는다 (매 프레임 읽으면 레이아웃 재계산으로 끊김)
  let W = 1, H = 1;
  const maxDpr = renderer.getPixelRatio();
  let dpr = maxDpr;
  function resize() {
    const w = canvas.clientWidth, hh = canvas.clientHeight;
    if (!w || !hh) return;
    W = w; H = hh;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, hh, false);
    camera.aspect = w / hh;
    camera.fov = w / hh < 0.9 ? 55 : 45;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  const camPos = new THREE.Vector3(), camUp = pos.clone().normalize(), look = pos.clone();
  {
    const n = pos.clone().normalize();
    camPos.copy(pos).addScaledVector(n, 30).addScaledVector(camFwd, -20); // 우주에서 내려오며 시작
  }

  // 매 프레임 재사용하는 임시 벡터 (새로 만들지 않아 GC 끊김 방지)
  const move = new THREE.Vector3(), v = new THREE.Vector3(), prev = new THREE.Vector3();
  const n = new THREE.Vector3(), right = new THREE.Vector3(), to = new THREE.Vector3();
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), target = new THREE.Vector3(), want = new THREE.Vector3();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const TURN_SPEED = 4.2;   // 캐릭터 회전 최대 속도 (rad/s)
  const CAM_FOLLOW = 0.9;   // 카메라가 캐릭터 방향을 따라가는 빠르기 (작을수록 느긋함)
  const CAM_MAX_TURN = 0.9; // 카메라 최대 회전 속도 (rad/s, 약 50°/초)
  let camVel = 0;           // 카메라 회전 속도 (가속·감속을 부드럽게)
  let lightState = null, beaconOn = null, bubbleText = '', bubbleHalf = 60;
  let frames = 0, frameTime = 0;
  const signedAngle = (a, b, axis) => Math.atan2(tmpA.crossVectors(a, b).dot(axis), a.dot(b));
  const projectTo = (p, el, clampHalf = 0) => {
    v.copy(p).project(camera);
    const off = v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2 || hiddenByPlanet(p);
    let x = (v.x * 0.5 + 0.5) * W;
    if (clampHalf) x = THREE.MathUtils.clamp(x, clampHalf, W - clampHalf);
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * H).toFixed(1)}px, 0) translate(-50%, -100%)`;
    return !off;
  };

  const stop = createLoop(renderer, canvas, (dt, t) => {
    nowT = t;
    // 성능이 부족하면 렌더 해상도를 낮추고, 여유가 생기면 다시 올린다
    frames++; frameTime += dt;
    if (frameTime > 1.5) {
      const avg = frameTime / frames;
      const next = avg > 1 / 45 ? Math.max(1, dpr - 0.25) : avg < 1 / 57 ? Math.min(maxDpr, dpr + 0.25) : dpr;
      if (next !== dpr) { dpr = next; renderer.setPixelRatio(dpr); renderer.setSize(W, H, false); }
      frames = 0; frameTime = 0;
    }

    n.copy(pos).normalize();
    // 시점 기준 벡터를 현재 위치의 접평면으로 옮긴다 (평행 이동)
    camFwd.addScaledVector(n, -n.dot(camFwd)).normalize();
    sunRef.addScaledVector(n, -n.dot(sunRef)).normalize();
    facing.addScaledVector(n, -n.dot(facing)).normalize();
    right.crossVectors(camFwd, n);

    move.set(0, 0, 0);
    if (inputOn) {
      if (keys.has('w') || keys.has('arrowup')) move.add(camFwd);
      if (keys.has('s') || keys.has('arrowdown')) move.sub(camFwd);
      if (keys.has('a') || keys.has('arrowleft')) move.sub(right);
      if (keys.has('d') || keys.has('arrowright')) move.add(right);
      while (!move.lengthSq() && route.length) {
        to.copy(route[0]).sub(pos); to.addScaledVector(n, -n.dot(to));
        if (to.length() < (route.length > 1 ? 0.9 : 0.3)) { route.shift(); stuck = 0; continue; }
        move.copy(to);
      }
    }
    const moving = move.lengthSq() > 1e-6;
    if (moving) {
      move.normalize();
      prev.copy(pos);
      pos.addScaledVector(move, SPEED * dt).normalize().multiplyScalar(RP);
      resolve(pos);
      // 육교: 계단 아래쪽 끝에서만 올라가고, 위에서는 난간 밖으로 못 나간다
      const { s, w } = bridgeLocal(pos);
      const inFoot = Math.abs(s) < BRIDGE.half && Math.abs(w) < BRIDGE.width / 2;
      if (onBridge) {
        if (!inFoot) { if (profile(bridgeLocal(prev).s) > 0.6) pos.copy(prev); else onBridge = false; }
      } else if (inFoot && Math.abs(s) > BRIDGE.deck) {
        if (profile(s) <= 0.7 || h >= profile(s) - 0.3) onBridge = true; else pos.copy(prev);
      }
      if (route.length && prev.distanceTo(pos) < SPEED * dt * 0.2) { stuck += dt; if (stuck > 0.7) { route.shift(); stuck = 0; } } else stuck = 0;
      n.copy(pos).normalize();
      // 캐릭터는 진행 방향으로 부드럽게 돈다 (최대 회전 속도 제한)
      const turn = signedAngle(facing, move, n);
      facing.applyAxisAngle(n, THREE.MathUtils.clamp(turn * (1 - Math.exp(-dt * 8)), -TURN_SPEED * dt, TURN_SPEED * dt));
      // 카메라는 캐릭터가 보는 방향 뒤로 느긋하게 따라 돈다.
      // 직접 시점을 돌린 직후, 또는 뒤로 걸어 카메라 쪽을 볼 때는 따라가지 않는다.
      const camTurn = signedAngle(camFwd, facing, n);
      const wantVel = t - lastDrag > 1.5 && Math.abs(camTurn) < 2.2 ? THREE.MathUtils.clamp(camTurn * CAM_FOLLOW, -CAM_MAX_TURN, CAM_MAX_TURN) : 0;
      camVel += (wantVel - camVel) * (1 - Math.exp(-dt * 3));
    } else camVel *= Math.exp(-dt * 4); // 멈추면 카메라 회전도 서서히 멈춤
    if (Math.abs(camVel) > 1e-4) {
      camFwd.applyAxisAngle(n, camVel * dt);
    }
    // 점프·중력
    vy += GRAVITY * dt; h += vy * dt;
    const gh = groundH();
    if (h <= gh) { h = gh; vy = 0; }
    if (onBridge && Math.abs(bridgeLocal(pos).s) >= BRIDGE.half - 0.05) onBridge = false;

    place(player, n, h, facing);
    animatePerson(player, moving && h <= gh + 0.01, dt, t);
    place(blob, n, gh + 0.04, northAt(n)); blob.rotateX(-Math.PI / 2);
    blob.material.opacity = 0.14 / (1 + (h - gh) * 0.6);
    if (marker.material.opacity > 0) marker.material.opacity = Math.max(0, marker.material.opacity - dt * 1.2);

    // 자동차: 앞에 사람이 있으면 멈춘다
    for (const c of cars) {
      const cosL = Math.cos(c.lat);
      tmpA.set(Math.cos(c.lat) * Math.cos(c.lon), Math.sin(c.lat), Math.cos(c.lat) * Math.sin(c.lon)); // 현재 위치 방향
      tmpB.set(-Math.sin(c.lon) * c.lane, 0, Math.cos(c.lon) * c.lane);                               // 진행 방향
      to.copy(tmpA).multiplyScalar(RP).addScaledVector(tmpB, 3);
      let blocked = h < 1.5 && to.distanceTo(pos) < 2.8;
      if (!blocked) for (const o of cars) if (o !== c && o.lane === c.lane && (((o.lon - c.lon) * c.lane + Math.PI * 4) % (Math.PI * 2)) * cosL * RP < 5) { blocked = true; break; }
      c.v = THREE.MathUtils.lerp(c.v, blocked ? 0 : 7, Math.min(1, dt * (blocked ? 6 : 1.5)));
      c.lon += (c.lane * c.v * dt) / (cosL * RP);
      place(c.g, tmpA, 0.02, tmpB);
    }
    // 신호등·통신탑 불빛 (상태가 바뀔 때만 색 변경)
    const greenOn = Math.floor(t / 4) % 2 === 0;
    if (greenOn !== lightState) {
      lightState = greenOn;
      lights.forEach((l) => { l.userData.red.color.set(greenOn ? '#5a2a26' : '#ff5a4a'); l.userData.green.color.set(greenOn ? '#4ade80' : '#1f4a2e'); });
    }
    const bOn = Math.sin(t * 4) > 0;
    if (bOn !== beaconOn) { beaconOn = bOn; beacon_.material.color.set(bOn ? '#ff3b30' : '#5a1a16'); }
    clouds.rotation.y += dt * 0.01;
    spout.scale.y = 0.55 + Math.sin(t * 3) * 0.06;

    for (const w of walkers) {
      w.lon += (w.dir * 1.6 * dt) / (Math.cos(w.lat) * RP);
      tmpA.set(Math.cos(w.lat) * Math.cos(w.lon), Math.sin(w.lat), Math.cos(w.lat) * Math.sin(w.lon));
      tmpB.set(-Math.sin(w.lon) * w.dir, 0, Math.cos(w.lon) * w.dir);
      place(w.g, tmpA, 0, tmpB);
      animatePerson(w.g, true, dt * 0.6, t);
    }

    // 근접 · 구역
    let near = null, talk = null, zone = null, zd = Infinity;
    for (const s of shopObjs) {
      if (s.doorP.distanceTo(pos) < 2.4 && h < 1) near = s;
      const npcP = s.npc.position;
      const close = npcP.distanceTo(pos) < 5.5;
      if (close) talk = s;
      const u = s.npc.userData;
      u.waving = close;
      u.arms[1].rotation.x = close ? -2.6 + Math.sin(t * 10) * 0.3 : THREE.MathUtils.lerp(u.arms[1].rotation.x, 0, 0.1);
      if (close || s.turned) {
        tmpA.copy(npcP).normalize();
        if (close) { tmpB.copy(pos).sub(npcP); tmpB.addScaledVector(tmpA, -tmpA.dot(tmpB)).normalize(); } else tmpB.copy(s.npcFwd);
        to.copy(zAxis).applyQuaternion(s.npc.quaternion).lerp(tmpB, Math.min(1, dt * 5));
        to.addScaledVector(tmpA, -tmpA.dot(to)).normalize();
        orient(s.npc, tmpA, to);
        s.turned = close || to.dot(s.npcFwd) < 0.999;
      }
      animatePerson(s.npc, false, dt, t + s.lon);
    }
    for (const z of zones) { const d = z.c.distanceTo(pos); if (d < z.r && d < zd) { zone = z; zd = d; } }
    if ((near?.shop.id ?? null) !== nearId) { nearId = near?.shop.id ?? null; onNear?.(near?.shop ?? null); }
    if ((zone?.name ?? null) !== zoneName) { zoneName = zone?.name ?? null; if (zone) onZone?.(zone); }
    if (talk !== talkShop) { talkShop = talk; typed = 0; }

    // 카메라: 플레이어 뒤·위에서, 행성의 위 방향을 따라 부드럽게
    const k = 1 - Math.pow(0.004, dt);
    camUp.lerp(n, k).normalize();
    target.copy(pos).addScaledVector(n, h + 1.3);
    want.copy(target).addScaledVector(camFwd, -camDist * Math.cos(camPitch)).addScaledVector(n, camDist * Math.sin(camPitch));
    if (want.length() < RP + 1.2) want.setLength(RP + 1.2); // 땅 속으로 들어가지 않게
    camPos.lerp(want, k);
    look.lerp(target, Math.min(1, k * 1.6));
    camera.position.copy(camPos);
    camera.up.copy(camUp);
    camera.lookAt(look);

    // 해와 하늘빛은 플레이어 기준으로 (행성 어디서든 낮)
    hemi.position.copy(n);
    tmpB.crossVectors(sunRef, n);
    tmpA.copy(n).addScaledVector(sunRef, 0.35).addScaledVector(tmpB, 0.45).normalize();
    sun.position.copy(pos).addScaledVector(tmpA, 30);
    sun.target.position.copy(pos);

    renderer.render(scene, camera);

    // HTML 위치 (쓰기만 하고 레이아웃 값은 읽지 않는다)
    shopObjs.forEach((s, i) => {
      tags[i].classList.toggle('hide', !projectTo(s.tagP, tags[i]) || zoneName === s.shop.name);
    });
    if (talkShop) {
      const text = talkShop.shop.greeting;
      typed = Math.min(text.length, typed + dt * 32);
      const shown = text.slice(0, Math.ceil(typed));
      if (shown !== bubbleText) {
        bubbleText = shown;
        bubble.textContent = shown;
        if (shown.length === text.length) bubbleHalf = bubble.offsetWidth / 2 + 8; // 문장이 다 나왔을 때 한 번만 측정
        else bubbleHalf = Math.max(bubbleHalf, 60);
      }
      to.copy(talkShop.npc.position).normalize().multiplyScalar(RP + 2.45);
      bubble.classList.toggle('show', projectTo(to, bubble, bubbleHalf));
    } else if (bubbleText) { bubbleText = ''; bubble.classList.remove('show'); }
  });

  return {
    walkTo,
    jump,
    setInput(on) { inputOn = on; keys.clear(); if (!on) route = []; },
    enterNear() { if (nearId) onEnterShop?.(shopObjs.find((s) => s.shop.id === nearId).shop); },
    dispose() {
      try { sessionStorage.setItem(SAVE_KEY, JSON.stringify({ p: pos.toArray(), f: facing.toArray(), c: camFwd.toArray() })); } catch { /* 무시 */ }
      stop(); ro.disconnect();
      removeEventListener('keydown', onKey); removeEventListener('keyup', onKey); removeEventListener('blur', clearKeys);
      bubble.remove(); tags.forEach((x) => x.remove());
      disposeScene(scene, renderer);
    },
  };
}
