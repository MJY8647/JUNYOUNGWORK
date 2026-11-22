import * as THREE from 'three';
import { toon, mesh, rbox, instanced, createLoop, createRenderer, disposeScene } from './toon.js';

// 걸어서 둘러보는 휴대폰 쇼핑 마을.
// 플레이 구조(3인칭 이동, 따라오는 카메라, NPC 말풍선, 구역 이름, 근접 상호작용)는
// Messenger 분석에서 가져왔고, 지형·건물·캐릭터는 이 매장을 위해 새로 만든 것이다.

const R = 24; // 섬 반지름
const SHOP_RING = 15;
const PLAYER_R = 0.45;
const SPEED = 5.2;
const C = {
  grass: '#a5d97c', grassDark: '#86c464', sand: '#f2d7a0', water: '#86d3ea', foam: '#d9f3fa',
  stone: '#f1e4cd', stoneDark: '#dccbae', trunk: '#9a6a45', leaf: ['#6fbf73', '#59ad62', '#84cc6e'],
  skin: '#ffd2b0', hair: '#4a3328', ink: '#2b1d17',
};
const SAVE_KEY = 'town-pos-v1';

function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }

function signTexture(text, bg) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 112;
  const g = c.getContext('2d');
  g.fillStyle = '#3a2a24'; g.beginPath(); g.roundRect(0, 0, 512, 112, 30); g.fill();
  g.fillStyle = bg; g.beginPath(); g.roundRect(6, 6, 500, 100, 26); g.fill();
  g.fillStyle = '#fff'; g.font = 'bold 60px "Jua", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 60);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// 사람 모형 (플레이어·점원 공용). 다리·팔은 관절에서 회전.
function person({ body, cap, hair = C.hair, pack }) {
  const g = new THREE.Group();
  const limb = (color, len) => {
    const pivot = new THREE.Group();
    const m = mesh(new THREE.CapsuleGeometry(0.11, len, 4, 8), toon(color), { thickness: 0.02 });
    m.position.y = -len / 2 - 0.08;
    pivot.add(m);
    return pivot;
  };
  const legs = [-0.13, 0.13].map((x) => { const l = limb('#4b5d8a', 0.32); l.position.set(x, 0.58, 0); g.add(l); return l; });
  const arms = [-0.36, 0.36].map((x) => { const a = limb(body, 0.3); a.position.set(x, 1.2, 0); a.rotation.z = x < 0 ? -0.15 : 0.15; g.add(a); return a; });
  const torso = mesh(new THREE.CapsuleGeometry(0.29, 0.34, 6, 14), toon(body), { thickness: 0.02 });
  torso.position.y = 0.98;
  const head = new THREE.Group();
  head.position.y = 1.66;
  head.add(mesh(new THREE.SphereGeometry(0.31, 24, 16), toon(C.skin), { thickness: 0.02 }));
  const eyeMat = new THREE.MeshBasicMaterial({ color: C.ink });
  [-0.1, 0.1].forEach((x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), eyeMat); e.position.set(x, 0.02, 0.285); head.add(e); });
  const cheek = new THREE.MeshBasicMaterial({ color: '#ff9d86' });
  [-0.18, 0.18].forEach((x) => { const e = new THREE.Mesh(new THREE.CircleGeometry(0.045, 12), cheek); e.position.set(x, -0.07, 0.29); e.lookAt(x * 3, -0.07, 2); head.add(e); });
  if (cap) {
    const top = mesh(new THREE.SphereGeometry(0.325, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), toon(cap), { thickness: 0.02 });
    top.position.y = 0.04;
    const brim = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 20, 1, false, -Math.PI / 2, Math.PI), toon(cap), { thickness: 0.015 });
    brim.position.set(0, 0.06, 0.26);
    brim.scale.z = 1.3;
    head.add(top, brim);
  } else {
    const h = mesh(new THREE.SphereGeometry(0.325, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), toon(hair), { thickness: 0.02 });
    h.position.y = 0.03; h.rotation.x = -0.3;
    head.add(h);
  }
  g.add(torso, head);
  if (pack) {
    const b = mesh(rbox(0.46, 0.5, 0.24, 0.08), toon(pack), { thickness: 0.02 });
    b.position.set(0, 1.0, -0.33);
    g.add(b);
  }
  g.userData = { legs, arms, head, torso, phase: 0 };
  return g;
}

function animatePerson(p, moving, dt, t) {
  const u = p.userData;
  u.phase += dt * (moving ? 11 : 0);
  const amp = moving ? 0.75 : 0;
  u.legs[0].rotation.x = THREE.MathUtils.lerp(u.legs[0].rotation.x, Math.sin(u.phase) * amp, 0.3);
  u.legs[1].rotation.x = THREE.MathUtils.lerp(u.legs[1].rotation.x, -Math.sin(u.phase) * amp, 0.3);
  u.arms[0].rotation.x = THREE.MathUtils.lerp(u.arms[0].rotation.x, -Math.sin(u.phase) * amp * 0.8, 0.3);
  if (!u.waving) u.arms[1].rotation.x = THREE.MathUtils.lerp(u.arms[1].rotation.x, Math.sin(u.phase) * amp * 0.8, 0.3);
  const bob = moving ? Math.abs(Math.sin(u.phase)) * 0.06 : Math.sin(t * 2) * 0.012;
  u.torso.position.y = 0.98 + bob;
  u.head.position.y = 1.66 + bob;
}

function buildShop(shop) {
  const W = 5.4, D = 4.2, H = 3.7;
  const g = new THREE.Group();
  const walls = mesh(rbox(W, H, D, 0.2), toon(shop.wall), { thickness: 0.05 });
  walls.position.y = H / 2;
  const roofGeo = new THREE.ConeGeometry(W * 0.8, 1.8, 4, 1).rotateY(Math.PI / 4);
  const roof = mesh(roofGeo, toon(shop.color), { thickness: 0.05 });
  roof.scale.z = D / W + 0.05;
  roof.position.y = H + 0.85;
  const door = mesh(rbox(1.3, 2.15, 0.2, 0.08), toon('#8d5634'), { thickness: 0.03 });
  door.position.set(0, 1.08, D / 2 + 0.03);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd66b' }));
  knob.position.set(0.42, 1.05, D / 2 + 0.16);
  const winMat = toon('#bfe8f7', { emissive: '#8fd3ee', emissiveIntensity: 0.35 });
  const wins = [-1.75, 1.75].map((x) => { const w = mesh(rbox(1.25, 1.05, 0.16, 0.06), winMat, { thickness: 0.03 }); w.position.set(x, 1.55, D / 2 + 0.03); return w; });
  const awning = mesh(rbox(W + 0.5, 0.16, 1.1, 0.05), toon(shop.color), { thickness: 0.04 });
  awning.position.set(0, 2.62, D / 2 + 0.5);
  awning.rotation.x = 0.28;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.79), new THREE.MeshBasicMaterial({ map: signTexture(shop.name, shop.color), transparent: true }));
  sign.position.set(0, 3.2, D / 2 + 0.12);
  // 창가 진열 폰
  const phoneMat = toon('#2d2a33');
  const screenMat = new THREE.MeshBasicMaterial({ color: shop.screen ?? '#9db8ff' });
  [-1.75, 1.75].forEach((x) => [-0.3, 0.3].forEach((dx) => {
    const ph = mesh(rbox(0.26, 0.5, 0.05, 0.04), phoneMat, { thickness: 0.012, cast: false });
    ph.position.set(x + dx, 1.45, D / 2 + 0.16);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.43), screenMat);
    sc.position.z = 0.03;
    ph.add(sc);
    g.add(ph);
  }));
  g.add(walls, roof, door, knob, ...wins, awning, sign);
  return { group: g, W, D };
}

export function createTown({ canvas, overlay, shops, onNear, onZone, onEnterShop }) {
  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
  const mobile = matchMedia('(max-width: 760px)').matches;

  scene.add(new THREE.HemisphereLight('#fff6e6', '#9cc7a0', 1.55));
  const sun = new THREE.DirectionalLight('#fff1dc', 2.3);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  // 바다와 섬
  const water = new THREE.Mesh(new THREE.CircleGeometry(160, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: C.water }));
  water.position.y = -0.7;
  const foam = new THREE.Mesh(new THREE.RingGeometry(R - 0.2, R + 1.4, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: C.foam, transparent: true, opacity: 0.8 }));
  foam.position.y = -0.66;
  const cliff = mesh(new THREE.CylinderGeometry(R, R - 1.2, 1.6, 64), toon(C.sand), { thickness: 0.06, cast: false });
  cliff.position.y = -0.8;
  const grass = new THREE.Mesh(new THREE.CircleGeometry(R - 0.9, 64).rotateX(-Math.PI / 2), toon(C.grass));
  grass.position.y = 0.005;
  grass.receiveShadow = true;
  scene.add(water, foam, cliff, grass);

  // 광장과 분수
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(6.2, 48).rotateX(-Math.PI / 2), toon(C.stone));
  plaza.position.y = 0.02;
  plaza.receiveShadow = true;
  const plazaEdge = new THREE.Mesh(new THREE.RingGeometry(6.2, 6.6, 48).rotateX(-Math.PI / 2), toon(C.stoneDark));
  plazaEdge.position.y = 0.021;
  plazaEdge.receiveShadow = true;
  const basin = mesh(new THREE.CylinderGeometry(1.9, 2.0, 0.55, 32), toon('#d8c6a8'), { thickness: 0.04 });
  basin.position.y = 0.27;
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.65, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#7cc9e6' }));
  pool.position.y = 0.5;
  const column = mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.3, 16), toon('#d8c6a8'), { thickness: 0.03 });
  column.position.y = 0.9;
  const bowl = mesh(new THREE.CylinderGeometry(0.75, 0.35, 0.3, 24), toon('#d8c6a8'), { thickness: 0.03 });
  bowl.position.y = 1.6;
  const spout = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 10), new THREE.MeshBasicMaterial({ color: '#bfe9f7', transparent: true, opacity: 0.85 }));
  spout.position.y = 1.85;
  spout.scale.set(1, 0.55, 1);
  scene.add(plaza, plazaEdge, basin, pool, column, bowl, spout);

  const colliders = { circles: [{ x: 0, z: 0, r: 2.05 }], boxes: [] };

  // 가게 배치: 광장을 둘러싼 원형, 문은 광장을 향함
  const shopObjs = shops.map((s, i) => {
    const a = -Math.PI / 2 + (i / shops.length) * Math.PI * 2;
    const x = Math.cos(a) * SHOP_RING, z = Math.sin(a) * SHOP_RING;
    const rot = Math.atan2(-x, -z);
    const { group, W, D } = buildShop(s);
    group.position.set(x, 0, z);
    group.rotation.y = rot;
    scene.add(group);
    const fwd = new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot));
    const door = new THREE.Vector3(x, 0, z).addScaledVector(fwd, D / 2 + 1.7);
    // 점원
    const npc = person({ body: s.color, hair: s.hair ?? C.hair });
    const side = new THREE.Vector3(Math.cos(rot), 0, -Math.sin(rot));
    npc.position.set(x, 0, z).addScaledVector(fwd, D / 2 + 0.9).addScaledVector(side, 2.1);
    npc.rotation.y = rot;
    scene.add(npc);
    colliders.boxes.push({ x, z, rot, hw: W / 2 + 0.1, hd: D / 2 + 0.1 });
    colliders.circles.push({ x: npc.position.x, z: npc.position.z, r: 0.45 });
    // 길
    const dist = SHOP_RING - D / 2 - 6.4;
    const path = new THREE.Mesh(new THREE.PlaneGeometry(2.4, dist).rotateX(-Math.PI / 2), toon(C.stone));
    path.position.set(Math.cos(a) * (6.4 + dist / 2), 0.018, Math.sin(a) * (6.4 + dist / 2));
    path.rotation.y = rot;
    path.receiveShadow = true;
    scene.add(path);
    return { shop: s, x, z, a, rot, door, npc, group };
  });

  // 가로등
  shopObjs.forEach(({ a }) => {
    [-1, 1].forEach((sideSign) => {
      const r = 9.5, off = 1.8 * sideSign;
      const px = Math.cos(a) * r - Math.sin(a) * off, pz = Math.sin(a) * r + Math.cos(a) * off;
      const post = mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 8), toon('#5a4a42'), { thickness: 0.02 });
      post.position.set(px, 1.3, pz);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshBasicMaterial({ color: '#fff1b8' }));
      bulb.position.set(px, 2.7, pz);
      scene.add(post, bulb);
      colliders.circles.push({ x: px, z: pz, r: 0.25 });
    });
  });

  // 벤치
  [Math.PI / 5, Math.PI * 0.8, Math.PI * 1.25, Math.PI * 1.75].forEach((a) => {
    const b = mesh(rbox(1.6, 0.14, 0.55, 0.05), toon('#b9764b'), { thickness: 0.025 });
    const r = 4.6;
    b.position.set(Math.cos(a) * r, 0.5, Math.sin(a) * r);
    b.rotation.y = -a + Math.PI / 2;
    const legs = mesh(rbox(1.3, 0.45, 0.4, 0.05), toon('#8d5634'), { thickness: 0.02 });
    legs.position.y = -0.27;
    b.add(legs);
    scene.add(b);
  });

  // 나무·꽃 (시드 고정 랜덤, 길과 가게를 피해서)
  const rand = rng(7);
  const nearPath = (x, z) => shopObjs.some(({ a }) => {
    const along = x * Math.cos(a) + z * Math.sin(a);
    const across = Math.abs(-x * Math.sin(a) + z * Math.cos(a));
    return along > 0 && along < SHOP_RING && across < 2.4;
  });
  const free = (x, z, pad) => Math.hypot(x, z) > 7.5 && !nearPath(x, z) &&
    shopObjs.every((s) => Math.hypot(x - s.x, z - s.z) > 5.2 + pad);
  const treeMx = [[], [], []], trunkMx = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  for (let tries = 0, n = 0; n < (mobile ? 46 : 64) && tries < 2000; tries++) {
    const ang = rand() * Math.PI * 2, rad = 8 + rand() * (R - 10.5);
    const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
    if (!free(x, z, 0.8) || colliders.circles.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + 1.4)) continue;
    const s = 0.8 + rand() * 0.6;
    trunkMx.push(m4.compose(pos.set(x, 0.55 * s, z), q.identity(), sc.set(s, s, s)).clone());
    treeMx[n % 3].push(m4.compose(pos.set(x, 1.7 * s, z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * 6), sc.set(s, s * 1.1, s)).clone());
    colliders.circles.push({ x, z, r: 0.5 * s });
    n++;
  }
  scene.add(instanced(new THREE.CylinderGeometry(0.16, 0.22, 1.1, 8), toon(C.trunk), trunkMx, { thickness: 0.03 }));
  treeMx.forEach((mx, i) => scene.add(instanced(new THREE.IcosahedronGeometry(1.0, 1), toon(C.leaf[i]), mx, { thickness: 0.04 })));
  ['#ff8fa3', '#ffd66b', '#ffffff', '#b9a7f0'].forEach((col) => {
    const mx = [];
    for (let i = 0; i < 40; i++) {
      const ang = rand() * Math.PI * 2, rad = 7 + rand() * (R - 8.5);
      const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
      if (!free(x, z, 0)) continue;
      mx.push(m4.compose(pos.set(x, 0.12, z), q.identity(), sc.setScalar(0.7 + rand() * 0.5)).clone());
    }
    scene.add(instanced(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial({ color: col }), mx, { outline: false, cast: false }));
  });

  // 플레이어
  const player = person({ body: '#ff7a59', cap: '#3a6fd8', pack: '#59c3a6' });
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.12 }));
  // 나무·건물 뒤에 가려진 부분만 실루엣으로 보이게 (깊이 테스트 반전)
  const xray = new THREE.MeshBasicMaterial({ color: '#3a2a24', transparent: true, opacity: 0.45, depthWrite: false, depthFunc: THREE.GreaterDepth });
  const bodies = [];
  player.traverse((o) => { if (o.isMesh && o.material.isMeshToonMaterial) bodies.push(o); });
  bodies.forEach((o) => {
    const x = new THREE.Mesh(o.geometry, xray);
    x.renderOrder = 10;
    x.raycast = () => {};
    o.add(x);
    // 캐릭터 본체는 실루엣보다 나중에 그려서, 실루엣이 배경 깊이에만 반응하게 한다
    o.material.transparent = true;
    o.renderOrder = 20;
    o.children.forEach((c) => { if (c !== x) { c.material = c.material.clone(); c.material.transparent = true; c.renderOrder = 20; } });
  });
  scene.add(player, blob);
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(SAVE_KEY)); } catch { /* 저장소 사용 불가 */ }
  player.position.set(saved?.x ?? 0, 0, saved?.z ?? 4.5);
  let heading = saved?.h ?? Math.PI;
  player.rotation.y = heading;

  // 탭 위치 표시
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.45, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 }));
  marker.position.y = 0.04;
  scene.add(marker);

  // ---------- 입력 ----------
  const keys = new Set();
  let route = [], inputOn = true, stuck = 0;
  const RING = 3.7; // 분수를 피해 도는 광장 순환 반지름
  const angOf = (p) => Math.atan2(p.z, p.x);
  const onKey = (e) => {
    if (!inputOn || e.target.closest?.('input, select, textarea')) return;
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      if (e.type === 'keydown') { keys.add(k); route = []; e.preventDefault(); } else keys.delete(k);
    }
  };
  const clearKeys = () => keys.clear();
  addEventListener('keydown', onKey);
  addEventListener('keyup', onKey);
  addEventListener('blur', clearKeys);

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => {
    if (!inputOn || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 10) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hitShop = shopObjs.find((s) => ray.intersectObject(s.group, true).length);
    if (hitShop) { walkTo(hitShop.shop.id); return; }
    const p = new THREE.Vector3();
    if (ray.ray.intersectPlane(groundPlane, p) && Math.hypot(p.x, p.z) < R - 1.2) {
      route = detour(player.position, p).concat([p]);
      marker.position.set(p.x, 0.04, p.z);
      marker.material.opacity = 0.9;
      marker.scale.setScalar(1);
    }
  });

  // 직선이 분수를 지나가면 분수 옆으로 돌아가는 점을 끼워 넣는다
  function detour(a, b) {
    const ab = new THREE.Vector3().subVectors(b, a), len = ab.length();
    if (len < 1e-3) return [];
    const t = THREE.MathUtils.clamp(-a.dot(ab) / (len * len), 0, 1);
    const c = a.clone().addScaledVector(ab, t);
    if (Math.hypot(c.x, c.z) > 2.7) return [];
    const side = c.lengthSq() > 1e-4 ? c.setY(0).normalize() : new THREE.Vector3(-ab.z, 0, ab.x).normalize();
    return [side.multiplyScalar(RING)];
  }

  // 가게까지 길을 따라 이동: 광장 순환로 → 가게 앞 길 → 문 앞
  function walkTo(id) {
    const s = shopObjs.find((o) => o.shop.id === id);
    if (!s) return;
    const p = player.position, r = Math.hypot(p.x, p.z);
    let d = s.a - angOf(p);
    d = Math.atan2(Math.sin(d), Math.cos(d));
    route = [];
    if (!(r > 5 && Math.abs(d) < 0.25)) { // 이미 그 가게 길 위가 아니면 광장을 거쳐 간다
      const a0 = angOf(p);
      if (r > 6.6) route.push(new THREE.Vector3(Math.cos(a0) * 5.6, 0, Math.sin(a0) * 5.6));
      const steps = Math.max(1, Math.ceil(Math.abs(d) / 0.5));
      for (let i = r < RING ? 0 : 1; i <= steps; i++) {
        const a = a0 + (d * i) / steps;
        route.push(new THREE.Vector3(Math.cos(a) * RING, 0, Math.sin(a) * RING));
      }
    }
    route.push(new THREE.Vector3(Math.cos(s.a) * 8, 0, Math.sin(s.a) * 8), s.door.clone());
  }

  // ---------- 충돌 ----------
  function resolve(p) {
    for (const c of colliders.circles) {
      const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), min = c.r + PLAYER_R;
      if (d < min && d > 1e-4) { p.x = c.x + (dx / d) * min; p.z = c.z + (dz / d) * min; }
    }
    for (const b of colliders.boxes) {
      const cos = Math.cos(b.rot), sin = Math.sin(b.rot);
      const dx = p.x - b.x, dz = p.z - b.z;
      let lx = dx * cos - dz * sin, lz = dx * sin + dz * cos;
      const ox = b.hw + PLAYER_R - Math.abs(lx), oz = b.hd + PLAYER_R - Math.abs(lz);
      if (ox > 0 && oz > 0) {
        if (ox < oz) lx += Math.sign(lx) * ox; else lz += Math.sign(lz) * oz;
        p.x = b.x + lx * cos + lz * sin;
        p.z = b.z - lx * sin + lz * cos;
      }
    }
    const d = Math.hypot(p.x, p.z), max = R - 1.6;
    if (d > max) { p.x *= max / d; p.z *= max / d; }
  }

  // ---------- 말풍선 · 가게 이름표 ----------
  const bubble = document.createElement('div');
  bubble.className = 'npc-bubble';
  bubble.setAttribute('aria-live', 'polite');
  overlay.appendChild(bubble);
  const tags = shopObjs.map((s) => {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'shop-tag';
    t.textContent = s.shop.name;
    t.style.setProperty('--c', s.shop.color);
    t.addEventListener('click', () => walkTo(s.shop.id));
    overlay.appendChild(t);
    return t;
  });
  let talkShop = null, typed = 0;

  // ---------- 카메라 ----------
  let portrait = false;
  const camOffset = () => (portrait ? new THREE.Vector3(0, 17, 12) : new THREE.Vector3(0, 10.5, 12.5));
  const camPos = player.position.clone().add(camOffset()).add(new THREE.Vector3(0, 12, 10)); // 입장 시 하늘에서 내려옴
  const look = player.position.clone();

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    portrait = w / h < 0.9;
    camera.fov = portrait ? 46 : 38;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let nearId = null, zoneId = null;
  const move = new THREE.Vector3(), v = new THREE.Vector3();

  const stop = createLoop(renderer, canvas, (dt, t) => {
    // 이동 방향: 카메라가 북쪽(-z)을 보고 있으므로 화면 위 = -z
    move.set(0, 0, 0);
    if (inputOn) {
      if (keys.has('w') || keys.has('arrowup')) move.z -= 1;
      if (keys.has('s') || keys.has('arrowdown')) move.z += 1;
      if (keys.has('a') || keys.has('arrowleft')) move.x -= 1;
      if (keys.has('d') || keys.has('arrowright')) move.x += 1;
      while (!move.lengthSq() && route.length) {
        move.set(route[0].x - player.position.x, 0, route[0].z - player.position.z);
        if (move.length() < (route.length > 1 ? 0.6 : 0.25)) { route.shift(); move.set(0, 0, 0); stuck = 0; }
      }
    }
    const moving = move.lengthSq() > 0;
    if (moving) {
      move.normalize();
      const before = player.position.clone();
      player.position.addScaledVector(move, SPEED * dt);
      resolve(player.position);
      // 장애물에 0.7초 넘게 막히면 다음 지점으로 넘어가거나 멈춘다
      if (route.length && before.distanceTo(player.position) < SPEED * dt * 0.2) {
        stuck += dt;
        if (stuck > 0.7) { route.shift(); stuck = 0; }
      } else stuck = 0;
      const want = Math.atan2(move.x, move.z);
      let diff = want - heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      heading += diff * Math.min(1, dt * 12);
      player.rotation.y = heading;
    }
    animatePerson(player, moving, dt, t);
    blob.position.set(player.position.x, 0.03, player.position.z);
    marker.material.opacity = Math.max(0, marker.material.opacity - dt * 1.2);
    marker.scale.setScalar(1 + (0.9 - marker.material.opacity) * 0.6);

    // 근접 판정
    let near = null, zone = null, zoneD = Infinity, talk = null;
    for (const s of shopObjs) {
      const dDoor = player.position.distanceTo(s.door);
      if (dDoor < 2.3) near = s;
      const dc = Math.hypot(player.position.x - s.x, player.position.z - s.z);
      if (dc < 9 && dc < zoneD) { zone = s; zoneD = dc; }
      if (player.position.distanceTo(s.npc.position) < 5.5) talk = s;
      // 점원: 플레이어가 가까우면 쳐다보고 손 흔들기
      const u = s.npc.userData;
      const close = talk === s;
      u.waving = close;
      u.arms[1].rotation.x = close ? -2.6 + Math.sin(t * 10) * 0.3 : THREE.MathUtils.lerp(u.arms[1].rotation.x, 0, 0.1);
      const face = close ? Math.atan2(player.position.x - s.npc.position.x, player.position.z - s.npc.position.z) : s.rot;
      let df = face - s.npc.rotation.y; df = Math.atan2(Math.sin(df), Math.cos(df));
      s.npc.rotation.y += df * Math.min(1, dt * 5);
      animatePerson(s.npc, false, dt, t + s.a);
    }
    if ((near?.shop.id ?? null) !== nearId) { nearId = near?.shop.id ?? null; onNear?.(near?.shop ?? null); }
    if ((zone?.shop.id ?? null) !== zoneId) { zoneId = zone?.shop.id ?? null; onZone?.(zone?.shop ?? null); }
    if (talk !== talkShop) { talkShop = talk; typed = 0; }

    // 카메라 추적
    const k = 1 - Math.pow(0.02, dt);
    camPos.lerp(v.copy(player.position).add(camOffset()), k);
    look.lerp(v.copy(player.position).setY(1), k * 1.5);
    camera.position.copy(camPos);
    camera.lookAt(look);
    sun.position.copy(player.position).add(new THREE.Vector3(8, 16, 7));
    sun.target.position.copy(player.position);
    spout.scale.y = 0.55 + Math.sin(t * 3) * 0.06;

    renderer.render(scene, camera);

    // HTML 오버레이 위치
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const place = (el, p) => {
      v.copy(p).project(camera);
      const off = v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2;
      el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, -100%)`;
      return !off;
    };
    shopObjs.forEach((s, i) => {
      const show = place(tags[i], v.set(s.x, 6.6, s.z)) && zoneId !== s.shop.id;
      tags[i].classList.toggle('hide', !show);
    });
    if (talkShop) {
      const text = talkShop.shop.greeting;
      typed = Math.min(text.length, typed + dt * 32);
      bubble.textContent = text.slice(0, Math.ceil(typed));
      const vis = place(bubble, v.copy(talkShop.npc.position).setY(2.45));
      const half = bubble.offsetWidth / 2 + 8;
      const bx = THREE.MathUtils.clamp((v.x * 0.5 + 0.5) * w, half, w - half);
      bubble.style.transform = `translate(${bx}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, -100%)`;
      bubble.classList.toggle('show', vis);
    } else bubble.classList.remove('show');
  });

  return {
    walkTo,
    setInput(on) { inputOn = on; keys.clear(); if (!on) route = []; },
    enterNear() { if (nearId) onEnterShop?.(shopObjs.find((s) => s.shop.id === nearId).shop); },
    dispose() {
      try { sessionStorage.setItem(SAVE_KEY, JSON.stringify({ x: player.position.x, z: player.position.z, h: heading })); } catch { /* 무시 */ }
      stop(); ro.disconnect();
      removeEventListener('keydown', onKey); removeEventListener('keyup', onKey); removeEventListener('blur', clearKeys);
      bubble.remove(); tags.forEach((t) => t.remove());
      disposeScene(scene, renderer);
    },
  };
}
