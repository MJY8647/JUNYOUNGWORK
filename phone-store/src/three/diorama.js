import * as THREE from 'three';
import { toon, mesh, rbox, createPhone, createLoop, createRenderer, disposeScene } from './toon.js';
import { won } from '../pricing.js';

const C = {
  floorA: '#f6d9b8', floorB: '#efc9a1', slab: '#c98f62', wall: '#ffe7cf', wallSide: '#f2c9a6',
  wood: '#b9764b', woodDark: '#8d5634', coral: '#ff7a59', mint: '#59c3a6', cream: '#fff6ea',
  skin: '#ffd2b0', hair: '#4a3328', leaf: '#6fbf73', leafDark: '#4f9f5a', pot: '#e0855c',
};

function checker() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = C.floorA; g.fillRect(0, 0, 64, 64);
  g.fillStyle = C.floorB; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 3);
  t.magFilter = THREE.NearestFilter;
  return t;
}

function signTexture(text) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = C.coral; g.beginPath(); g.roundRect(4, 4, 504, 120, 60); g.fill();
  g.fillStyle = '#fff'; g.font = 'bold 64px "Jua", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function plant(scale = 1) {
  const g = new THREE.Group();
  const pot = mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.32, 16), toon(C.pot));
  pot.position.y = 0.16;
  g.add(pot);
  [[0, 0.55, 0, 0.3, C.leaf], [0.14, 0.75, 0.05, 0.22, C.leafDark], [-0.12, 0.72, -0.04, 0.2, C.leaf]].forEach(([x, y, z, r, col]) => {
    const b = mesh(new THREE.IcosahedronGeometry(r, 1), toon(col));
    b.position.set(x, y, z);
    g.add(b);
  });
  g.scale.setScalar(scale);
  return g;
}

function clerk() {
  const g = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(0.26, 0.4, 6, 16), toon(C.mint));
  body.position.y = 0.55;
  const apron = mesh(rbox(0.36, 0.42, 0.06, 0.03), toon(C.cream));
  apron.position.set(0, 0.5, 0.24);
  const head = mesh(new THREE.SphereGeometry(0.27, 24, 16), toon(C.skin));
  head.position.y = 1.18;
  const hair = mesh(new THREE.SphereGeometry(0.285, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), toon(C.hair));
  hair.position.y = 1.2;
  hair.rotation.x = -0.25;
  const eyeGeo = new THREE.SphereGeometry(0.035, 10, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#2b1d17' });
  [-0.09, 0.09].forEach((x) => { const e = new THREE.Mesh(eyeGeo, eyeMat); e.position.set(x, 1.18, 0.25); g.add(e); });
  const cheekMat = new THREE.MeshBasicMaterial({ color: '#ff9d86' });
  [-0.16, 0.16].forEach((x) => { const e = new THREE.Mesh(new THREE.CircleGeometry(0.04, 12), cheekMat); e.position.set(x, 1.11, 0.255); g.add(e); });
  const arm = new THREE.Group();
  arm.position.set(0.3, 0.8, 0);
  const armMesh = mesh(new THREE.CapsuleGeometry(0.07, 0.3, 4, 8), toon(C.mint));
  armMesh.position.y = -0.18;
  arm.add(armMesh);
  arm.rotation.z = 0.3;
  g.add(body, apron, head, hair, arm);
  g.userData = { arm, head };
  return g;
}

export function createDiorama({ canvas, overlay, products, storeName, onSelect }) {
  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight('#fff4e2', '#f0b48c', 1.6));
  const sun = new THREE.DirectionalLight('#fff1dc', 2.4);
  sun.position.set(5, 9, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(matchMedia('(max-width: 760px)').matches ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const room = new THREE.Group();
  scene.add(room);

  // 바닥 슬랩
  const slab = mesh(rbox(8.4, 0.4, 6.4, 0.12), toon(C.slab));
  slab.position.y = -0.2;
  room.add(slab);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 6).rotateX(-Math.PI / 2), toon('#ffffff', { map: checker() }));
  floor.position.y = 0.002;
  floor.receiveShadow = true;
  room.add(floor);

  // 벽 (디오라마처럼 두 면만)
  const back = mesh(rbox(8.4, 3.4, 0.3, 0.08), toon(C.wall));
  back.position.set(0, 1.7, -3.05);
  const left = mesh(rbox(0.3, 3.4, 6.4, 0.08), toon(C.wallSide));
  left.position.set(-4.05, 1.7, 0);
  room.add(back, left);

  // 창문
  const win = mesh(rbox(0.08, 1.2, 1.8, 0.05), toon('#9fd8f2', { emissive: '#6fbfe0', emissiveIntensity: 0.25 }));
  win.position.set(-3.88, 1.8, 0.4);
  const frameMat = toon(C.cream);
  const fv = mesh(rbox(0.1, 1.3, 0.08, 0.02), frameMat); fv.position.set(-3.86, 1.8, 0.4);
  const fh = mesh(rbox(0.1, 0.08, 1.9, 0.02), frameMat); fh.position.set(-3.86, 1.8, 0.4);
  room.add(win, fv, fh);

  // 간판
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshBasicMaterial({ map: signTexture(storeName), transparent: true }));
  sign.position.set(0.6, 2.75, -2.89);
  room.add(sign);

  // 벽 선반과 상자들
  const shelf = mesh(rbox(3.0, 0.1, 0.5, 0.03), toon(C.wood));
  shelf.position.set(1.9, 1.75, -2.65);
  room.add(shelf);
  ['#ffb36b', '#8fd3c1', '#ff8f7a', '#b9a7f0', '#ffd66b'].forEach((col, i) => {
    const b = mesh(rbox(0.36, 0.42 + (i % 2) * 0.12, 0.3, 0.04), toon(col));
    b.position.set(0.75 + i * 0.55, 2.0 + (i % 2) * 0.06, -2.62);
    room.add(b);
  });

  // 계산대 + 점원
  const counter = mesh(rbox(2.0, 1.0, 0.8, 0.08), toon(C.wood));
  counter.position.set(-2.6, 0.5, -2.1);
  const top = mesh(rbox(2.15, 0.1, 0.95, 0.04), toon(C.woodDark));
  top.position.set(-2.6, 1.05, -2.1);
  const register = mesh(rbox(0.5, 0.32, 0.4, 0.06), toon(C.coral));
  register.position.set(-2.2, 1.26, -2.1);
  room.add(counter, top, register);
  const npc = clerk();
  npc.position.set(-2.9, 0, -2.65);
  npc.rotation.y = 0.35;
  room.add(npc);

  // 러그, 화분
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40).rotateX(-Math.PI / 2), toon('#ffcfa8'));
  rug.position.set(0.3, 0.006, 0.2);
  rug.scale.set(1.35, 1, 0.85);
  rug.receiveShadow = true;
  room.add(rug);
  [[3.5, 2.5, 1.1], [-3.5, -0.9, 1.25], [3.5, -2.5, 0.9]].forEach(([x, z, s]) => { const p = plant(s); p.position.set(x, 0, z); room.add(p); });

  // 진열대
  const stands = [];
  // 뒷줄을 오른쪽으로 비켜 계산대와 점원이 보이게 배치
  const spots = [[-0.7, -0.7], [1.2, -0.7], [3.0, -0.4], [-2.0, 1.5], [0.0, 1.5], [2.0, 1.7]];
  products.slice(0, spots.length).forEach((p, i) => {
    const [x, z] = spots[i];
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const ped = mesh(new THREE.CylinderGeometry(0.5, 0.58, 0.7, 28), toon(i % 2 ? C.cream : '#ffe2c8'));
    ped.position.y = 0.35;
    const cap = mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.08, 28), toon(i % 2 ? C.mint : C.coral));
    cap.position.y = 0.74;
    const phone = createPhone(p.name, p.tone);
    phone.scale.setScalar(0.72);
    phone.userData.height *= 0.72;
    phone.position.y = 0.82 + phone.userData.height / 2;
    phone.rotation.x = -0.08;
    g.add(ped, cap, phone);
    // 펜던트 조명
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.0, 4), new THREE.MeshBasicMaterial({ color: '#6b4b3a' }));
    cord.position.y = 3.3;
    const shade = mesh(new THREE.ConeGeometry(0.28, 0.26, 20, 1, true), toon(i % 2 ? C.coral : C.mint, { side: THREE.DoubleSide }), { cast: false });
    shade.position.y = 2.7;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff3c4' }));
    bulb.position.y = 2.6;
    g.add(cord, shade, bulb);
    g.userData = { index: i, phone, baseY: phone.position.y, product: p, lamp: [cord, shade, bulb] };
    room.add(g);
    stands.push(g);
  });

  // 진열대 위 HTML 라벨 (텍스트가 선명하고 접근성 확보)
  const labels = stands.map((s) => {
    const b = document.createElement('button');
    b.className = 'stand-label';
    b.type = 'button';
    const p = s.userData.product;
    b.innerHTML = `<span class="sl-name">${p.name}</span><span class="sl-price">${won(p.dealPrice)}~</span>`;
    b.addEventListener('click', () => select(s.userData.index));
    overlay.appendChild(b);
    return b;
  });

  // 카메라
  const home = { pos: new THREE.Vector3(7.4, 6.4, 9.2), look: new THREE.Vector3(0.1, 0.7, 0) };
  const cam = { pos: home.pos.clone(), look: home.look.clone(), tPos: home.pos.clone(), tLook: home.look.clone() };
  let selected = -1, portrait = false;

  function fitHome() {
    const k = portrait ? 1.5 : 1;
    const target = home.pos.clone().sub(home.look).multiplyScalar(k).add(home.look);
    if (selected < 0) cam.tPos.copy(target);
    return target;
  }

  const showLamps = (on) => stands.forEach((s) => s.userData.lamp.forEach((m) => { m.visible = on; }));

  function select(i) {
    selected = i;
    const s = stands[i];
    const top = s.position.clone().add(new THREE.Vector3(0, 1.1, 0));
    const offset = new THREE.Vector3(1.9, 3.3, 4.4).multiplyScalar(portrait ? 1.3 : 1);
    // 아래쪽 정보 카드에 가리지 않도록 시선을 살짝 내린다
    cam.tLook.copy(top).add(new THREE.Vector3(0, portrait ? -0.6 : -0.25, 0));
    cam.tPos.copy(top).add(offset);
    labels.forEach((l, k) => l.classList.toggle('on', k === i));
    showLamps(false); // 확대 시 조명이 시야를 가리지 않도록
    onSelect?.(s.userData.product, i);
  }

  function reset() {
    selected = -1;
    cam.tLook.copy(home.look);
    fitHome();
    labels.forEach((l) => l.classList.remove('on'));
    showLamps(true);
    onSelect?.(null, -1);
  }

  // 포인터 선택
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(stands, true)[0];
    if (!hit) return reset();
    let o = hit.object;
    while (o && o.userData.index === undefined) o = o.parent;
    if (o) select(o.userData.index);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    canvas.style.cursor = ray.intersectObjects(stands, true).length ? 'pointer' : 'grab';
  });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    portrait = w / h < 1;
    camera.fov = portrait ? 38 : 30;
    camera.updateProjectionMatrix();
    if (selected >= 0) select(selected); else fitHome();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  cam.pos.copy(cam.tPos).add(new THREE.Vector3(3, 4, 4)); // 입장 연출: 위에서 내려오며 다가옴

  const v = new THREE.Vector3();
  const stop = createLoop(renderer, canvas, (dt, t) => {
    const k = 1 - Math.pow(0.0025, dt);
    cam.pos.lerp(cam.tPos, k);
    cam.look.lerp(cam.tLook, k);
    const sway = selected < 0 ? 0.25 : 0.06;
    camera.position.copy(cam.pos).add(v.set(Math.sin(t * 0.3) * sway, Math.sin(t * 0.45) * sway * 0.4, 0));
    camera.lookAt(cam.look);

    stands.forEach((s, i) => {
      const ph = s.userData.phone;
      const active = i === selected;
      ph.rotation.y += dt * (active ? 0.9 : 0.35);
      ph.position.y = s.userData.baseY + Math.sin(t * 1.6 + i) * 0.04 + (active ? 0.12 : 0);
    });
    const { arm, head } = npc.userData;
    arm.rotation.z = selected >= 0 ? 2.4 + Math.sin(t * 9) * 0.35 : 0.3 + Math.sin(t * 1.4) * 0.05;
    head.position.y = 1.18 + Math.sin(t * 2) * 0.012;
    npc.position.y = Math.abs(Math.sin(t * 2)) * 0.015;

    renderer.render(scene, camera);

    // 라벨 위치 갱신
    const w = canvas.clientWidth, h = canvas.clientHeight;
    stands.forEach((s, i) => {
      v.copy(s.position).setY(s.userData.baseY + s.userData.phone.userData.height / 2 + 0.25).project(camera);
      const l = labels[i];
      // 좁은 세로 화면에서는 라벨이 겹치므로 선택된 것만 보여준다 (아래 칩으로 선택 가능)
      const hidden = v.z > 1 || (selected >= 0 && i !== selected) || (portrait && selected < 0);
      l.style.opacity = hidden ? '0' : '1';
      l.style.pointerEvents = hidden ? 'none' : 'auto';
      l.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, -100%)`;
    });
  });

  return {
    select, reset,
    dispose() { stop(); ro.disconnect(); labels.forEach((l) => l.remove()); disposeScene(scene, renderer); },
  };
}
