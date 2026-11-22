import * as THREE from 'three';
import { toon, mesh, createPhone, setPhoneColor, createLoop, createRenderer, disposeScene } from './toon.js';

// 상품 상세의 3D 폰 뷰어: 드래그로 회전, 손을 떼면 천천히 자동 회전
export function createViewer({ canvas, product, color }) {
  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 1.9, 7.4);

  scene.add(new THREE.HemisphereLight('#fff4e2', '#f0b48c', 1.7));
  const key = new THREE.DirectionalLight('#fff1dc', 2.4);
  key.position.set(3, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(1024);
  Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2 });
  key.shadow.normalBias = 0.02;
  scene.add(key);

  const ped = mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.3, 40), toon('#ffe2c8'));
  ped.position.y = -0.15;
  const cap = mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.06, 40), toon('#ff7a59'));
  cap.position.y = 0.03;
  scene.add(ped, cap);

  const phone = createPhone(product.name, color);
  phone.scale.setScalar(1.45);
  phone.userData.height *= 1.45;
  const pivot = new THREE.Group();
  pivot.add(phone);
  phone.position.y = phone.userData.height / 2 + 0.12;
  scene.add(pivot);
  const look = new THREE.Vector3(0, phone.userData.height / 2 + 0.1, 0);

  let rotY = -0.5, velY = 0, dragging = false, lastX = 0, idle = 0;
  const target = new THREE.Color(color);
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    velY = dx * 0.012; rotY += velY; idle = 0;
  });
  const up = () => { dragging = false; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const stop = createLoop(renderer, canvas, (dt, t) => {
    if (!dragging) {
      idle += dt;
      velY *= Math.pow(0.04, dt);
      rotY += velY + (idle > 1.2 ? dt * 0.5 : 0);
    }
    pivot.rotation.y = rotY;
    phone.position.y = phone.userData.height / 2 + 0.12 + Math.sin(t * 1.5) * 0.03;
    const m = phone.userData.bodyMat.color;
    if (!m.equals(target)) {
      m.lerp(target, 1 - Math.pow(0.001, dt));
      setPhoneColor(phone, m.getHex());
    }
    camera.lookAt(look);
    renderer.render(scene, camera);
  });

  return {
    setColor(hex) { target.set(hex); },
    dispose() { stop(); ro.disconnect(); disposeScene(scene, renderer); },
  };
}
