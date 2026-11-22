import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// 3단계 툰 그라디언트 (Messenger처럼 경계가 또렷한 셀 셰이딩)
let gradient;
function gradientMap() {
  if (gradient) return gradient;
  const data = new Uint8Array([90, 90, 90, 255, 180, 180, 180, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

export const toon = (color, extra = {}) =>
  new THREE.MeshToonMaterial({ color, gradientMap: gradientMap(), ...extra });

// 법선 방향으로 부풀린 뒷면을 그려 외곽선을 만든다 (inverted hull).
const outlineMat = new THREE.ShaderMaterial({
  uniforms: { thickness: { value: 0.012 }, color: { value: new THREE.Color('#3a2a24') } },
  vertexShader: `uniform float thickness;
    void main(){ vec3 p = position + normal * thickness;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }`,
  fragmentShader: `uniform vec3 color; void main(){ gl_FragColor = vec4(color,1.0); }`,
  side: THREE.BackSide,
});

export function mesh(geometry, material, { outline = true, cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  if (outline) {
    const o = new THREE.Mesh(geometry, outlineMat);
    o.raycast = () => {};
    m.add(o);
  }
  return m;
}

export const rbox = (w, h, d, r = 0.04, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2));

// 화면용 캔버스 그라디언트
function screenTexture(tone) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 128, 256);
  const base = new THREE.Color(tone);
  const hsl = {}; base.getHSL(hsl);
  grad.addColorStop(0, `hsl(${(hsl.h * 360 + 20) % 360} 80% 72%)`);
  grad.addColorStop(1, `hsl(${(hsl.h * 360 + 300) % 360} 70% 55%)`);
  g.fillStyle = grad; g.fillRect(0, 0, 128, 256);
  g.fillStyle = 'rgba(255,255,255,.85)';
  g.font = 'bold 34px sans-serif'; g.textAlign = 'center';
  g.fillText('10:00', 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 이름으로 대략적인 형태를 고른다. 실제 기기 모델링이 아닌 툰 스타일 표현.
export function phoneShape(name = '') {
  if (name.includes('폴더')) return { w: 0.62, h: 1.0, d: 0.16, lenses: 1 };
  if (name.includes('플립')) return { w: 0.72, h: 0.95, d: 0.13, lenses: 2 };
  if (name.includes('폴드') || name.includes('듀오')) return { w: 1.0, h: 1.4, d: 0.09, lenses: 3 };
  if (name.includes('프로') || name.includes('울트라')) return { w: 0.72, h: 1.5, d: 0.09, lenses: 3 };
  return { w: 0.7, h: 1.46, d: 0.08, lenses: 2 };
}

export function createPhone(name, tone) {
  const s = phoneShape(name);
  const group = new THREE.Group();
  const bodyMat = toon(tone);
  const body = mesh(rbox(s.w, s.h, s.d, 0.08, 4), bodyMat);
  group.add(body);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(s.w * 0.88, s.h * 0.92),
    new THREE.MeshBasicMaterial({ map: screenTexture(tone) }),
  );
  screen.position.z = s.d / 2 + 0.002;
  group.add(screen);

  const bump = mesh(rbox(s.w * 0.42, s.w * 0.42, 0.03, 0.05), toon(new THREE.Color(tone).multiplyScalar(0.85)));
  bump.position.set(-s.w * 0.22, s.h / 2 - s.w * 0.27, -s.d / 2 - 0.012);
  group.add(bump);
  const lensGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.03, 20).rotateX(Math.PI / 2);
  const lensMat = toon('#1d1b22');
  const spots = [[-0.07, 0.07], [-0.07, -0.07], [0.07, 0]].slice(0, s.lenses);
  for (const [x, y] of spots) {
    const l = mesh(lensGeo, lensMat, { cast: false });
    l.position.set(bump.position.x + x, bump.position.y + y, -s.d / 2 - 0.03);
    group.add(l);
  }
  group.userData.bodyMat = bodyMat;
  group.userData.bumpMat = bump.material;
  group.userData.height = s.h;
  return group;
}

export function setPhoneColor(phone, hex) {
  phone.userData.bodyMat.color.set(hex);
  phone.userData.bumpMat.color.set(hex).multiplyScalar(0.85);
}

// 메인 스레드 부담을 줄이기 위해 화면 밖이거나 탭이 숨겨지면 렌더 중지
export function createLoop(renderer, canvas, frame) {
  let visible = true, raf = 0, last = performance.now();
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible || document.hidden) return;
    frame(dt, now / 1000);
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); io.disconnect(); };
}

export function createRenderer(canvas, { shadows = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const mobile = matchMedia('(max-width: 760px)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.75 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

export function disposeScene(scene, renderer) {
  scene.traverse((o) => {
    o.geometry?.dispose();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => { if (m && m !== outlineMat) { m.map?.dispose(); m.dispose(); } });
  });
  renderer.dispose();
}
