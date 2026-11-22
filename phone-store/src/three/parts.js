import * as THREE from 'three';
import { toon, mesh, rbox } from './toon.js';

// 마을 공용 부품: 사람, 가게 건물, 간판

export const C = {
  grass: '#a5d97c', grassDark: '#86c464', sand: '#f2d7a0', water: '#86d3ea', foam: '#d9f3fa',
  stone: '#f1e4cd', stoneDark: '#dccbae', trunk: '#9a6a45', leaf: ['#6fbf73', '#59ad62', '#84cc6e'],
  skin: '#ffd2b0', hair: '#4a3328', ink: '#2b1d17',
};

export function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }

export function signTexture(text, bg) {
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
export function person({ body, cap, hair = C.hair, pack }) {
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

export function animatePerson(p, moving, dt, t) {
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

export function buildShop(shop) {
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
