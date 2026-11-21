/* 폰파리 3D 월드 — 에펠탑 광장, 군중, 노점, 여섯 폰팔이, 스크롤 카메라.
 * 모두 코드로 만든 절차적 모델입니다(외부 3D 파일 없음). three.js r128 전역 THREE 사용.
 */
(function () {
  "use strict";
  var T = window.THREE;

  // 영상의 카메라 구도를 장면 순서대로 (pos, look, fov)
  var DEALERS = ["designer", "quick", "price", "safe", "used", "allinone"];
  // 노점 여섯 개는 탑 앞(샹드마르스 쪽)에 반원으로, 손님(샹드마르스)을 바라봄. 탑은 노점 뒤로 보임
  var DEALER_C = new T.Vector3(0, 0, 26), DEALER_R = 14;
  function dealerOut(i) { var a = (i - 2.5) * .42; return new T.Vector3(Math.sin(a), 0, Math.cos(a)); }   // 노점이 바라보는 방향
  function dealerPos(i) { return DEALER_C.clone().add(dealerOut(i).multiplyScalar(DEALER_R)); }

  function buildShots() {
    var s = [
      { pos: [0, 150, 330], look: [0, 42, 0], fov: 38 },   // 광장 전경
      { pos: [10, 175, 52], look: [0, 0, 6], fov: 46 },    // 탑 위에서 내려다보기
      { pos: [0, 6, 72], look: [0, 9, 18], fov: 55 },      // 탑 앞 노점 거리 (뒤로 탑 아치)
    ];
    DEALERS.forEach(function (id, i) {
      var p = dealerPos(i), cam = p.clone().add(dealerOut(i).multiplyScalar(7.6)); cam.y = 3.2; // 손님 자리에서 노점과 뒤의 탑을 봄
      s.push({ pos: cam.toArray(), look: [p.x, 3.3, p.z], fov: 54, dealer: id });
    });
    s.push({ pos: [0, 2.6, 30], look: [0, 30, -6], fov: 62 });  // 마무리: 탑 올려다보기
    return s;
  }

  /* ---------- 유틸 ---------- */
  var UP = new T.Vector3(0, 1, 0);
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  // 선분 → 인스턴스 행렬 (단위 박스를 a→b로 늘림)
  function segMatrix(a, b, w, m) {
    var d = new T.Vector3().subVectors(b, a), len = d.length();
    var q = new T.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
    return m.compose(new T.Vector3().addVectors(a, b).multiplyScalar(.5), q, new T.Vector3(w, len, w));
  }

  /* ---------- 에펠탑 ---------- */
  var HW = [[0, 21], [10, 15.6], [19, 11.7], [30, 8.2], [38.5, 6.2], [55, 3.9], [70, 2.6], [85, 1.6], [92, 1.15]];
  function hw(y) {
    for (var i = 1; i < HW.length; i++) if (y <= HW[i][0]) {
      var a = HW[i - 1], b = HW[i]; return lerp(a[1], b[1], (y - a[0]) / (b[0] - a[0]));
    }
    return 1.1;
  }
  function legT(y) { return lerp(7, 3.4, Math.min(1, y / 38.5)); }

  function buildTower() {
    var segs = [], V = function (x, y, z) { return new T.Vector3(x, y, z); };
    var mid = function (a, b) { return a.clone().add(b).multiplyScalar(.5); };
    function S(a, b, w) { segs.push([a, b, w]); }
    // 면 하나를 두 칸으로 나눠 X 두 개 + 가운데 기둥 (영상의 촘촘한 격자)
    function face(p0, p1, q0, q1, w) {
      var pm = mid(p0, p1), qm = mid(q0, q1);
      S(pm, qm, w * .9); S(p0, qm, w); S(pm, q0, w); S(pm, q1, w); S(p1, qm, w);
    }
    var y, k;
    // 네 다리 (2층까지)
    [-1, 1].forEach(function (sx) {
      [-1, 1].forEach(function (sz) {
        var prev = null;
        for (y = 0; y <= 38.5 + .01; y += 1.9) {
          var o = hw(y), n = o - legT(y);
          var c = [V(sx * o, y, sz * o), V(sx * n, y, sz * o), V(sx * n, y, sz * n), V(sx * o, y, sz * n)];
          for (k = 0; k < 4; k++) S(c[k], c[(k + 1) % 4], .24);
          if (prev) for (k = 0; k < 4; k++) { S(prev[k], c[k], .55); face(prev[k], prev[(k + 1) % 4], c[k], c[(k + 1) % 4], .13); }
          prev = c;
        }
      });
    });
    // 몸통 (2층 → 꼭대기): 바깥 면 + 안쪽 대각
    var prev = null;
    for (y = 38.5; y <= 92.01; y += 2.2) {
      var h = hw(y), c = [V(h, y, h), V(-h, y, h), V(-h, y, -h), V(h, y, -h)];
      for (k = 0; k < 4; k++) S(c[k], c[(k + 1) % 4], .2);
      if (prev) {
        var t = (y - 38.5) / 54;
        for (k = 0; k < 4; k++) { S(prev[k], c[k], lerp(.5, .2, t)); face(prev[k], prev[(k + 1) % 4], c[k], c[(k + 1) % 4], lerp(.12, .07, t)); }
        if (Math.round(y / 2.2) % 3 === 0) { S(c[0], c[2], .08); S(c[1], c[3], .08); }
      }
      prev = c;
    }
    // 아치 네 면: 두 겹 곡선 + 지그재그 격자
    for (var side = 0; side < 4; side++) {
      var rot = side * Math.PI / 2, arcs = [[], [], []];
      for (var a = 0; a <= 36; a++) {
        var th = Math.PI * a / 36, R = 11.6;
        for (var l = 0; l < 3; l++) {
          var x = Math.cos(th) * (R + (l === 2 ? .3 : 0)), yy = 5 + Math.sin(th) * (12.2 - (l === 1 ? 1.2 : 0) + (l === 2 ? 2.6 : 0)), z = 13.4 + (l === 1 ? -.9 : 0);
          if (l === 2) yy = Math.min(yy, 18.2);
          arcs[l].push(V(x * Math.cos(rot) - z * Math.sin(rot), yy, x * Math.sin(rot) + z * Math.cos(rot)));
        }
      }
      for (a = 1; a < arcs[0].length; a++) {
        S(arcs[0][a - 1], arcs[0][a], .42); S(arcs[1][a - 1], arcs[1][a], .3); S(arcs[2][a - 1], arcs[2][a], .2);
        S(a % 2 ? arcs[0][a - 1] : arcs[0][a], a % 2 ? arcs[1][a] : arcs[1][a - 1], .1);
        S(a % 2 ? arcs[0][a] : arcs[0][a - 1], arcs[2][a], .09);
      }
    }
    // 1층 바깥 장식 아치 띠 (전망대 아래 작은 아치들)
    for (side = 0; side < 4; side++) {
      var rr = side * Math.PI / 2, half = hw(19) + 1.4, n2 = 9;
      for (var j = 0; j < n2; j++) {
        var x0 = -half + j * (2 * half / n2), x1 = x0 + 2 * half / n2, pts = [];
        for (var q = 0; q <= 6; q++) { var th2 = Math.PI * q / 6; pts.push([lerp(x0, x1, q / 6), 16.6 + Math.sin(th2) * 1.6]); }
        for (q = 1; q < pts.length; q++) {
          var A = pts[q - 1], B = pts[q], zz = half + .1;
          S(V(A[0] * Math.cos(rr) - zz * Math.sin(rr), A[1], A[0] * Math.sin(rr) + zz * Math.cos(rr)),
            V(B[0] * Math.cos(rr) - zz * Math.sin(rr), B[1], B[0] * Math.sin(rr) + zz * Math.cos(rr)), .14);
        }
      }
    }
    var geo = new T.BoxGeometry(1, 1, 1);
    var mat = new T.MeshStandardMaterial({ color: 0x4f3d2e, roughness: .8, metalness: .25 });
    var mesh = new T.InstancedMesh(geo, mat, segs.length), m = new T.Matrix4();
    segs.forEach(function (s, i) { mesh.setMatrixAt(i, segMatrix(s[0], s[1], s[2], m)); });
    mesh.castShadow = true;
    var g = new T.Group(); g.add(mesh);
    var deck = new T.MeshStandardMaterial({ color: 0x45362a, roughness: .9 });
    [[19, hw(19) * 2 + 3.2, 1.4], [38.5, hw(38.5) * 2 + 2, 1]].forEach(function (d) {
      var b = new T.Mesh(new T.BoxGeometry(d[1], d[2], d[1]), deck); b.position.y = d[0]; b.castShadow = true; g.add(b);
      var rail = new T.Mesh(new T.BoxGeometry(d[1] + .6, .9, d[1] + .6), new T.MeshStandardMaterial({ color: 0x6b5644, transparent: true, opacity: .5 }));
      rail.position.y = d[0] + 1.1; g.add(rail);
      for (var p = 0; p < 4; p++) { // 전망대 위 작은 건물
        var hut = new T.Mesh(new T.BoxGeometry(d[1] * .3, 2.2, 2), deck); var an = p * Math.PI / 2;
        hut.position.set(Math.cos(an) * d[1] * .32, d[0] + 1.8, Math.sin(an) * d[1] * .32); hut.rotation.y = an; g.add(hut);
      }
    });
    var top = new T.Mesh(new T.BoxGeometry(3.2, 3.4, 3.2), deck); top.position.y = 92.5; g.add(top);
    var lantern = new T.Mesh(new T.CylinderGeometry(.9, 1.3, 2.4, 8), deck); lantern.position.y = 95.4; g.add(lantern);
    var ant = new T.Mesh(new T.CylinderGeometry(.12, .3, 9, 6), deck); ant.position.y = 101; g.add(ant);
    g.userData.segments = segs.length;
    return g;
  }

  /* ---------- 광장 타일, 노점, 군중 ---------- */
  var PASTEL = [0x9fd8cf, 0xf2a7b5, 0xc7b5ea, 0xf4d36b, 0x8fc9e8, 0xb8e0a0, 0xf6b98a];

  /* ---------- 지형: 실제 에펠탑 주변 배치를 줄인 비율로 ----------
   탑 뒤(-z)로 센강이 흐르고(남쪽 강둑 = 브랑리 강변), 탑 정면으로 이에나 다리, 강 건너 트로카데로 정원과 샤이오 궁.
   탑 앞(+z, 첫 장면 카메라 쪽)은 샹드마르스 잔디밭. 사람·노점은 사람이 실제로 있을 만한 곳(탑 아래 광장, 샹드마르스 길, 강변 산책로, 다리)에만. */
  var RIVER = { s: -100, n: -145 };            // 남쪽·북쪽 강둑 z
  function walkable(x, z) {
    var d = Math.hypot(x, z);
    return d >= 14 && d <= 58;                                           // 사람은 에펠탑 주위 광장에만
  }
  // 사람·노점이 놓일 자리: 구역별 비율로 고름
  function spot(r, kind) {
    var t = r();
    for (var k = 0; k < 40; k++) {
      var x, z;
      if (!kind || t < .46) { var a = r() * Math.PI * 2, rad = (kind ? 26 : 15) + r() * (kind ? 30 : 42); x = Math.cos(a) * rad; z = Math.sin(a) * rad; } // 사람은 탑 주위에만
      else if (t < .82) { z = 8 + r() * 280; x = (kind ? (r() < .5 ? -1 : 1) * (36 + r() * 18) : (r() - .5) * 112); }
      else if (t < .97) { x = (r() - .5) * 400; z = kind ? -89 : -96 + r() * 9; }
      else { if (kind) { t = r() * .82; continue; } x = (r() - .5) * 11; z = RIVER.n - 1 + r() * (RIVER.n * -1 - 88); }
      if (walkable(x, z)) return [x, z];
    }
    return [0, 40];
  }
  // 파리 건물 지붕: 위가 좁아지는 망사르드 (상자 지붕은 실사 변환 때 현대식 아파트처럼 읽힘)
  function mansard() { var g = new T.BoxGeometry(1, 1, 1), p = g.attributes.position; for (var i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * .62); p.setZ(i, p.getZ(i) * .55); } g.computeVertexNormals(); return g; }
  function buildPlaza(r, obs) {
    var g = new T.Group();
    // 바닥: 실사 변환 때 그대로 쓸 수 있게 실제 샹드마르스 배치로 (모래 자갈 광장·잔디·가로수 줄·차도·건물 블록)
    var ground = new T.Mesh(new T.PlaneGeometry(2400, 2400), new T.MeshStandardMaterial({ color: 0xcdbf9f, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
    var m = new T.Matrix4(), c = new T.Color(), q0 = new T.Quaternion();
    var lawnM = new T.MeshStandardMaterial({ color: 0x8faa6e, roughness: 1 }), roadM = new T.MeshStandardMaterial({ color: 0x7c7f83, roughness: .95 });
    function slab(w, d, x, z, mat, y) { var o = new T.Mesh(new T.BoxGeometry(w, y || .3, d), mat); o.position.set(x, (y || .3) / 2, z); o.receiveShadow = true; g.add(o); }
    [-1, 1].forEach(function (sd) {
      slab(44, 340, sd * 33, 260, lawnM);                 // 샹드마르스 가운데 잔디 두 줄 (가운데 모래길)
      slab(38, 360, sd * 90, 250, lawnM);                 // 양옆 잔디
      slab(44, 70, sd * 92, -20, lawnM);                  // 탑 양옆 정원
      slab(10, 540, sd * 128, 180, roadM, .2);            // 양쪽 대로
    });
    slab(640, 9, 0, -80, roadM, .2);                      // 브랑리 강변 차도
    // 가로수 줄 (샹드마르스 양옆, 탑 양옆 정원 둘레)
    var tp = [];
    [-1, 1].forEach(function (sd) {
      for (var z = 70; z <= 430; z += 8) { tp.push([sd * 60, z], [sd * 118, z]); }
      for (var z2 = -52; z2 <= 12; z2 += 8) tp.push([sd * 66, z2], [sd * 118, z2]);
    });
    var trunkG = new T.CylinderGeometry(.25, .35, 3, 6); trunkG.translate(0, 1.5, 0);
    var crownG = new T.SphereGeometry(2.4, 8, 6); crownG.translate(0, 4.4, 0);
    var trunks = new T.InstancedMesh(trunkG, new T.MeshStandardMaterial({ color: 0x5e4b3c, roughness: 1 }), tp.length);
    var crowns = new T.InstancedMesh(crownG, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), tp.length);
    tp.forEach(function (p, i) {
      var s2 = .9 + r() * .25; m.compose(new T.Vector3(p[0], 0, p[1]), q0, new T.Vector3(s2, s2, s2));
      trunks.setMatrixAt(i, m); crowns.setMatrixAt(i, m); crowns.setColorAt(i, c.setHex(0x6f9157).offsetHSL(0, 0, (r() - .5) * .08));
      obs.add(p[0], p[1], .6);
    });
    trunks.castShadow = crowns.castShadow = true; g.add(trunks, crowns);
    // 대로 바깥은 파리 건물 블록 (크림색 벽 + 회색 지붕)
    var blocks = [];
    for (var bx = 150; bx <= 400; bx += 34) for (var bz = -60; bz <= 430; bz += 30) if (r() < .85) [-1, 1].forEach(function (sd) { blocks.push([sd * (bx + (r() - .5) * 4), bz + (r() - .5) * 4, 26, 22, 14 + r() * 8]); });
    var wall = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0xffffff, roughness: .9 }), blocks.length);
    var roofs = new T.InstancedMesh(mansard(), new T.MeshStandardMaterial({ color: 0x6f7a86, roughness: .7 }), blocks.length);
    blocks.forEach(function (bk, i) {
      m.compose(new T.Vector3(bk[0], bk[4] / 2, bk[1]), q0, new T.Vector3(bk[2], bk[4], bk[3])); wall.setMatrixAt(i, m);
      wall.setColorAt(i, c.setHex(0xe6ddc9).offsetHSL(0, 0, (r() - .5) * .08));
      m.compose(new T.Vector3(bk[0], bk[4] + 2.1, bk[1]), q0, new T.Vector3(bk[2] * 1.02, 4.2, bk[3] * 1.02)); roofs.setMatrixAt(i, m);
    });
    wall.castShadow = true; g.add(wall, roofs);
    // 노점은 여섯 폰팔이만 둠 (잡화 노점 없음)
    var n = 0, base = new T.InstancedMesh(new T.BoxGeometry(2.6, 1.7, 1.8), new T.MeshStandardMaterial({ color: 0xffffff, roughness: .8 }), n);
    var roof = new T.InstancedMesh(new T.BoxGeometry(3.1, .35, 2.4), new T.MeshStandardMaterial({ color: 0xffffff, roughness: .7 }), n);
    var q = new T.Quaternion(), e = new T.Euler(), sc = new T.Vector3(1, 1, 1);
    for (var i = 0; i < n; i++) {
      var sp = spot(r, 1), px = sp[0], pz = sp[1];
      var face = pz < -84 ? 0 : Math.abs(px) > 30 && pz > 8 ? Math.PI / 2 : Math.atan2(px, pz); // 강변은 산책로, 샹드마르스는 길 쪽을 봄
      e.set(0, face + (r() - .5) * .3, 0); q.setFromEuler(e);
      m.compose(new T.Vector3(px, .85, pz), q, sc); base.setMatrixAt(i, m); obs.add(px, pz, 1.9);
      e.set(.18, e.y, 0); q.setFromEuler(e);
      m.compose(new T.Vector3(px, 1.9, pz), q, sc); roof.setMatrixAt(i, m);
      var col = PASTEL[i % PASTEL.length];
      base.setColorAt(i, c.setHex(col).lerp(new T.Color(0xffffff), .35)); roof.setColorAt(i, c.setHex(col));
    }
    g.add(base, roof);
    g.add(buildRiverside(r, obs));
    return g;
  }

  // 센강 + 이에나 다리 + 강 건너 트로카데로·샤이오 궁·파리 건물 (안개 속으로 자연스럽게 흐려짐)
  function buildRiverside(r, obs) {
    var g = new T.Group(), m = new T.Matrix4(), c = new T.Color(), q = new T.Quaternion(), e = new T.Euler();
    var stone = new T.MeshStandardMaterial({ color: 0xb8b0a1, roughness: .9 });
    var water = new T.Mesh(new T.PlaneGeometry(2400, RIVER.s - RIVER.n), new T.MeshStandardMaterial({ color: 0x6d8b9c, roughness: .22, metalness: .15 }));
    water.rotation.x = -Math.PI / 2; water.position.set(0, .08, (RIVER.s + RIVER.n) / 2); g.add(water);
    g.userData.water = water;
    [RIVER.s, RIVER.n].forEach(function (z, k) { // 강둑 돌벽
      var w = new T.Mesh(new T.BoxGeometry(2400, 1.3, 2), stone); w.position.set(0, .65, z + (k ? -1 : 1)); g.add(w);
    });
    // 이에나 다리: 상판 + 아치 기둥
    var deck = new T.Mesh(new T.BoxGeometry(14, .9, RIVER.s - RIVER.n + 6), stone); deck.position.set(0, 2.2, (RIVER.s + RIVER.n) / 2); g.add(deck);
    for (var k = 1; k < 5; k++) { var pr = new T.Mesh(new T.BoxGeometry(15, 2.2, 2.4), stone); pr.position.set(0, 1, RIVER.s + (RIVER.n - RIVER.s) * k / 5); g.add(pr); }
    // 강 건너 땅: 강둑 위 산책길 → 트로카데로 정원(계단식 잔디) → 샤이오 궁
    var far = new T.Mesh(new T.BoxGeometry(2400, 1.3, 700), new T.MeshStandardMaterial({ color: 0xa6a296, roughness: 1 })); far.position.set(0, .65, RIVER.n - 352); g.add(far);
    var green = new T.MeshStandardMaterial({ color: 0x86a36a, roughness: 1 });
    for (var t = 0; t < 4; t++) { var lw = new T.Mesh(new T.BoxGeometry(150 - t * 16, 1.6 + t * 2.4, 28), green); lw.position.set(0, 1.3 + t * 1.2, RIVER.n - 30 - t * 26); g.add(lw); }
    var pool = new T.Mesh(new T.BoxGeometry(18, .4, 70), new T.MeshStandardMaterial({ color: 0x7c9cab, roughness: .2, metalness: .15 })); pool.position.set(0, 2.2 + 3.6, RIVER.n - 70); g.add(pool); // 바르샤바 분수
    var cream = new T.MeshStandardMaterial({ color: 0xe3dccb, roughness: .85 }), zc = RIVER.n - 160;
    [-1, 1].forEach(function (sd) { // 샤이오 궁: 양쪽으로 굽은 두 날개 + 끝 동
      for (var k = 0; k < 9; k++) {
        var a = (.18 + k * .1) * sd, x = Math.sin(a) * 120, z = zc + 120 - Math.cos(a) * 120;
        var wing = new T.Mesh(new T.BoxGeometry(14.5, 14, 11), cream); wing.position.set(x, 9.3, z); wing.rotation.y = -a; g.add(wing);
      }
      var pav = new T.Mesh(new T.BoxGeometry(22, 20, 22), cream); pav.position.set(sd * 22, 12.3, zc + 4); g.add(pav);
    });
    // 강 건너 파리 건물 (오스만 양식 크림색 벽 + 회색 지붕), 강 양옆 나무
    var blocks = [];
    for (var i = 0; i < 90; i++) {
      var bx = (r() - .5) * 1100, bz = RIVER.n - 20 - r() * 520;
      if (Math.abs(bx) < 150 && bz > RIVER.n - 240) continue;               // 정원·궁 자리 비우기
      blocks.push([bx, bz, 16 + r() * 14, 18 + r() * 12, 14 + r() * 10, r() * .5]);
    }
    var wall = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0xffffff, roughness: .9 }), blocks.length);
    var roofs = new T.InstancedMesh(mansard(), new T.MeshStandardMaterial({ color: 0x6f7a86, roughness: .7 }), blocks.length);
    blocks.forEach(function (b, i) {
      e.set(0, b[5] - .25, 0); q.setFromEuler(e);
      m.compose(new T.Vector3(b[0], 1.3 + b[4] / 2, b[1]), q, new T.Vector3(b[2], b[4], b[3])); wall.setMatrixAt(i, m);
      wall.setColorAt(i, c.setHex(0xe6ddc9).offsetHSL(0, 0, (r() - .5) * .08));
      m.compose(new T.Vector3(b[0], 1.3 + b[4] + 2.2, b[1]), q, new T.Vector3(b[2] * 1.02, 4.4, b[3] * 1.02)); roofs.setMatrixAt(i, m);
    });
    g.add(wall, roofs);
    var trunkG = new T.CylinderGeometry(.25, .35, 3, 6); trunkG.translate(0, 1.5, 0);
    var crownG = new T.SphereGeometry(2.6, 8, 6); crownG.translate(0, 4.6, 0);
    var tp = [];
    for (var x2 = -230; x2 <= 230; x2 += 11) { if (Math.abs(x2) > 12) tp.push([x2, RIVER.s + 4.5, 0], [x2, RIVER.n - 5, 1.3]); }
    var trunks = new T.InstancedMesh(trunkG, new T.MeshStandardMaterial({ color: 0x5e4b3c, roughness: 1 }), tp.length);
    var crowns = new T.InstancedMesh(crownG, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), tp.length);
    tp.forEach(function (p, i) {
      var s2 = .85 + r() * .35; m.compose(new T.Vector3(p[0], p[2], p[1]), q.identity(), new T.Vector3(s2, s2, s2));
      trunks.setMatrixAt(i, m); crowns.setMatrixAt(i, m); if (p[2] === 0) obs.add(p[0], p[1], .6); crowns.setColorAt(i, c.setHex(0x6f9157).offsetHSL(0, 0, (r() - .5) * .08));
    });
    g.add(trunks, crowns);
    // 유람선 두 척 (천천히 강을 오감)
    var boats = [];
    [[-1, RIVER.s - 14, 0], [1, RIVER.n + 13, 600]].forEach(function (b) {
      var boat = new T.Group();
      var hull = new T.Mesh(new T.BoxGeometry(26, 1.6, 6), new T.MeshStandardMaterial({ color: 0xf2f0ea, roughness: .6 })); hull.position.y = .9; boat.add(hull);
      var cab = new T.Mesh(new T.BoxGeometry(20, 1.8, 5), new T.MeshStandardMaterial({ color: 0x9fb3bf, roughness: .2, metalness: .2 })); cab.position.y = 2.6; boat.add(cab);
      boat.position.set(b[2] - 300, 0, b[1]); boat.userData = { dir: b[0], off: b[2] }; g.add(boat); boats.push(boat);
    });
    g.userData.boats = boats;
    return g;
  }

  // 장애물(노점·부스·탑 다리) 격자: 사람이 통과하지 않도록
  function Obstacles() { this.cells = {}; this.size = 12; }
  Obstacles.prototype.key = function (cx, cz) { return cx + "," + cz; };
  Obstacles.prototype.add = function (x, z, r) {
    var o = { x: x, z: z, r: r }, S = this.size;
    for (var cx = Math.floor((x - r) / S); cx <= Math.floor((x + r) / S); cx++)
      for (var cz = Math.floor((z - r) / S); cz <= Math.floor((z + r) / S); cz++) (this.cells[this.key(cx, cz)] = this.cells[this.key(cx, cz)] || []).push(o);
  };
  Obstacles.prototype.hit = function (x, z, pad) {
    var list = this.cells[this.key(Math.floor(x / this.size), Math.floor(z / this.size))]; if (!list) return null;
    for (var i = 0; i < list.length; i++) { var o = list[i], dx = x - o.x, dz = z - o.z, rr = o.r + pad; if (dx * dx + dz * dz < rr * rr) return o; }
    return null;
  };

  // 군중: 몸통 + 머리 (사람 모양), 장애물을 피해 걸음
  function buildCrowd(r, n, obs, CS) { // CS: 사람 크기 배율 (프리비즈는 노점·실사 폰팔이 비율에 맞춰 키움)
    CS = CS || 1;
    var bodyG = new T.CylinderGeometry(.19, .25, 1.18, 8); bodyG.translate(0, .62, 0);
    var headG = new T.SphereGeometry(.17, 10, 8); headG.translate(0, 1.42, 0);
    var mat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: .85 });
    var bodies = new T.InstancedMesh(bodyG, mat, n), heads = new T.InstancedMesh(headG, mat, n);
    var people = [], c = new T.Color();
    var clothes = [0x2c3036, 0x3b4048, 0x565b63, 0x23262a, 0x6c6258, 0x45505c, 0x7a8a9c, 0x8c4a4a, 0xc9b79c, 0x4e6b5a];
    var skins = [0xf1c9a5, 0xe0ac85, 0xc68863, 0x9a6648, 0xf6d8bf];
    for (var i = 0; i < n; i++) {
      var x, z, tries = 0;
      do { var sp = spot(r, 0); x = sp[0]; z = sp[1]; tries++; } while (obs.hit(x, z, .5 * CS) && tries < 20);
      people.push({ x: x, z: z, h: r() * Math.PI * 2, v: (.6 + r() * .9) * CS, s: .88 + r() * .25, turn: 0 });
      bodies.setColorAt(i, c.setHex(clothes[i % clothes.length]));
      heads.setColorAt(i, c.setHex(skins[i % skins.length]));
    }
    var m = new T.Matrix4(), q = new T.Quaternion();
    people.forEach(function (p, k) { // 움직임 줄이기 설정에서도 제자리에 서 있도록 처음 위치를 기록
      m.compose(new T.Vector3(p.x, 0, p.z), q.setFromAxisAngle(UP, -p.h), new T.Vector3(CS, p.s * CS, CS)); bodies.setMatrixAt(k, m); heads.setMatrixAt(k, m);
    });
    bodies.instanceMatrix.setUsage(T.DynamicDrawUsage); heads.instanceMatrix.setUsage(T.DynamicDrawUsage);
    var g = new T.Group(); g.add(bodies, heads);
    g.userData = { people: people, bodies: bodies, heads: heads, cs: CS };
    return g;
  }

  /* ---------- 폰팔이 캐릭터 (영상처럼 둥근 모서리·광택 눈·소품) ---------- */
  function std(color, rough) { return new T.MeshStandardMaterial({ color: color, roughness: rough == null ? .62 : rough }); }
  function rshape(w, h, r) {
    var s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  function rbox(w, h, d, r, mat) { // 모서리 둥근 상자
    r = Math.min(r, w / 2 - .01, h / 2 - .01, d / 2 - .01);
    var g = new T.ExtrudeGeometry(rshape(w - 2 * r, h - 2 * r, .001 + r * .2), { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 5, curveSegments: 6 });
    g.translate(0, 0, -(d - 2 * r) / 2); g.computeVertexNormals();
    var m = new T.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
  }
  function lathe(points, mat, seg) {
    var m = new T.Mesh(new T.LatheGeometry(points.map(function (p) { return new T.Vector2(p[0], p[1]); }), seg || 40), mat);
    m.castShadow = true; return m;
  }
  function eyes(group, y, z, gap, size) { // 눈 한 쪽씩 그룹: 윙크·돋보기 눈 같은 표정용
    var white = new T.MeshStandardMaterial({ color: 0xffffff, roughness: .18 }), black = new T.MeshStandardMaterial({ color: 0x0c0c0e, roughness: .12, metalness: .2 });
    var shine = new T.MeshBasicMaterial({ color: 0xffffff });
    var pair = new T.Group(); pair.position.set(0, y, z);
    var pupils = [], eg = [];
    [-1, 1].forEach(function (s) {
      var e = new T.Group(); e.position.x = s * gap; pair.add(e); eg.push(e);
      var eye = new T.Mesh(new T.SphereGeometry(size, 28, 20), white); eye.scale.z = .6; e.add(eye);
      var p = new T.Group(); p.position.set(0, 0, size * .5); p.userData.base = p.position.clone();
      var pu = new T.Mesh(new T.SphereGeometry(size * .5, 20, 14), black); pu.scale.z = .5; p.add(pu);
      var hl = new T.Mesh(new T.SphereGeometry(size * .13, 10, 8), shine); hl.position.set(-size * .17, size * .17, size * .2); p.add(hl);
      e.add(p); pupils.push(p);
    });
    group.add(pair); group.userData.eyes = pair; group.userData.pupils = pupils; group.userData.eyeGroups = eg;
  }
  function limb(group, from, to, color, r, hand) { // 어깨에 관절(pivot)이 있는 캡슐 팔 + 공 손
    var a = new T.Vector3().fromArray(from), b = new T.Vector3().fromArray(to), d = b.clone().sub(a);
    var len = d.length(), mat = std(color, .55);
    var pivot = new T.Group(); pivot.position.copy(a); group.add(pivot);
    var mesh = new T.Mesh(new T.CylinderGeometry(r, r, len, 18), mat); mesh.castShadow = true;
    mesh.position.copy(d).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(UP, d.clone().normalize());
    var j = new T.Mesh(new T.SphereGeometry(r, 16, 12), mat);
    var end = new T.Mesh(new T.SphereGeometry(r * (hand || 1.3), 20, 14), mat); end.position.copy(d); end.castShadow = true;
    pivot.add(mesh, j, end);
    (group.userData.arms = group.userData.arms || []).push(pivot);
    return end;
  }
  function textTex(lines, fg, bg, w, h) {
    var c = document.createElement("canvas"); c.width = w || 256; c.height = h || 128; var x = c.getContext("2d");
    x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle";
    lines.forEach(function (l, i) { x.font = (l.w || 900) + " " + l.s + "px 'Noto Sans KR', system-ui, sans-serif"; x.fillText(l.t, c.width / 2, c.height * (i + .5) / lines.length); });
    var t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function plate(w, h, tex) { return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tex, roughness: .7 })); }

  function buildDealer(id, colorHex) {
    var g = new T.Group(), col = new T.Color(colorHex).getHex(), body, m = std(col);
    if (id === "designer") { // 라벤더 원기둥 + 긴 알약 팔
      body = lathe([[0, 0], [.74, 0], [.74, 4.1], [.7, 4.32], [.55, 4.44], [0, 4.46]], m, 48);
      eyes(g, 3.8, .68, .27, .21);
      limb(g, [.68, 2.6, .2], [1.15, 1.25, .75], 0xc4b6e6, .2, 1.4);
    } else if (id === "quick") { // 주황 상자 + 손수레 + 택배 상자
      body = rbox(2.1, 3.8, .95, .16, m); body.position.y = 1.9;
      eyes(g, 3.1, .52, .32, .21);
      limb(g, [1.05, 2.4, .1], [1.2, .55, .5], 0xf2b23d, .19);
      var rail = std(0x2f3135, .4);
      [[-2.55, .35], [-1.65, .35]].forEach(function (p) { var r = rbox(.12, 2.6, .12, .05, rail); r.position.set(p[0], 1.45, p[1]); r.rotation.z = -.12; g.add(r); });
      var wheel = new T.Mesh(new T.TorusGeometry(.48, .2, 14, 28), std(0x18191b, .8)); wheel.position.set(-2.1, .62, .9); wheel.rotation.y = Math.PI / 2; wheel.castShadow = true; g.add(wheel); g.userData.wheel = wheel;
      [[1.2, .8, .9, 1.4], [1.0, .7, .8, 2.15]].forEach(function (b) { var bx = rbox(b[0], b[1], b[2], .05, std(0xc99a62, .9)); bx.position.set(-2.1, b[3], .4); g.add(bx); });
    } else if (id === "price") { // 카키 원뿔 + 가격표
      body = lathe([[0, 0], [1.18, 0], [1.12, .2], [.2, 4.05], [.08, 4.25], [0, 4.3]], m, 48);
      body.rotation.z = -.06;
      eyes(g, 2.15, .72, .26, .2);
      var hand = limb(g, [.6, 1.9, .3], [1.45, 2.75, .55], 0xb3b483, .17);
      var tag = plate(.8, .5, textTex([{ t: "0원", s: 70 }], "#d8263a", "#fffdf2", 192, 120)); tag.position.copy(hand.position).add(new T.Vector3(.1, .45, .05)); hand.parent.add(tag);
    } else if (id === "safe") { // 남색 상자 + 두 팔 + 방패
      body = rbox(2.75, 3.4, 1.3, .2, m); body.position.y = 1.7;
      eyes(g, 2.85, .7, .34, .21);
      limb(g, [1.35, 2.3, 0], [2.15, .95, .55], 0x55669a, .21); limb(g, [-1.35, 2.3, 0], [-2.05, 1.25, .45], 0x55669a, .21);
      var sh = new T.Shape(); sh.moveTo(0, .5); sh.quadraticCurveTo(.45, .45, .5, .35); sh.lineTo(.42, -.15); sh.quadraticCurveTo(.25, -.45, 0, -.6); sh.quadraticCurveTo(-.25, -.45, -.42, -.15); sh.lineTo(-.5, .35); sh.quadraticCurveTo(-.45, .45, 0, .5);
      var shield = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: .08, bevelEnabled: true, bevelSize: .03, bevelThickness: .03 }), std(0xe8edf5, .35)); shield.position.set(0, 1.5, .67); g.add(shield); g.userData.shield = shield;
    } else if (id === "used") { // 버건디 기둥 + S급 팻말
      body = rbox(1.05, 4.6, .9, .14, m); body.position.y = 2.3;
      eyes(g, 3.9, .48, .23, .2);
      var h2 = limb(g, [.52, 3.1, 0], [1.15, 4.05, .4], 0xb54d69, .15);
      var sign = rbox(1.0, .66, .06, .04, std(0xffffff)); sign.position.copy(h2.position).add(new T.Vector3(.25, .55, .02)); sign.rotation.z = .25; h2.parent.add(sign);
      var st = plate(.9, .56, textTex([{ t: "S급", s: 78 }], "#9c3a55", "#ffffff", 192, 120)); st.position.copy(sign.position).add(new T.Vector3(0, 0, .04)); st.rotation.z = .25; h2.parent.add(st);
      var sticker = plate(.6, .4, textTex([{ t: "검수", s: 64 }], "#ffffff", "#5e1529", 160, 110)); sticker.position.set(0, 2.2, .46); g.add(sticker);
    } else { // 회색 달걀 + 가슴 선반 + 미니 폰
      body = lathe([[0, 0], [.9, .08], [1.45, .7], [1.6, 1.7], [1.42, 2.8], [.95, 3.65], [.4, 4.02], [0, 4.1]], std(col, .85), 48);
      eyes(g, 2.85, 1.37, .33, .21);
      limb(g, [1.4, 2.5, 0], [2.35, 3.35, .3], 0x8e8c86, .17); limb(g, [-1.4, 2.5, 0], [-2.35, 3.25, .3], 0x8e8c86, .17);
      var shelf = rbox(2.6, .1, .55, .03, std(0xf2f2f0, .4)); shelf.position.set(0, 2.15, 1.35); g.add(shelf);
      [0xd9cdf2, 0xf07a2c, 0xb9b2c9, 0x6e2a33, 0x9cc7d6].forEach(function (c2, k) { var ph = rbox(.26, .48, .05, .04, std(c2, .3)); ph.position.set(-.9 + k * .45, 2.45, 1.4); ph.rotation.x = -.15; g.add(ph); });
    }
    body.userData.dealer = id; g.add(body);
    g.traverse(function (o) { if (o.isMesh) { o.userData.dealer = id; o.castShadow = true; } });
    g.userData.blink = 2 + Math.random() * 3;
    g.userData.body = body; g.userData.col = new T.Color(colorHex); g.userData.glow = 0; g.userData.env = 0;
    return g;
  }

  // 각 폰팔이의 부스: 뒷판, 이름표, 걸이 진열, 카운터, 폰팔이별 소품
  function buildBooth(id, colorHex, r, name) {
    var g = new T.Group(), col = new T.Color(colorHex);
    var back = rbox(6.4, 3.3, .25, .06, std(0xc4c5c2, .8)); back.position.set(0, 1.65, -1.9); g.add(back);
    var strip = rbox(6.6, .5, .4, .08, std(col.getHex(), .5)); strip.position.set(0, 3.5, -1.85); g.add(strip);
    if (name) { var nm = plate(2.6, .42, textTex([{ t: name, s: 60 }], "#ffffff", "#" + col.getHexString(), 512, 84)); nm.position.set(0, 3.5, -1.63); g.add(nm); }
    var metal = std(0x55595e, .4);
    [-3.1, 3.1].forEach(function (x) { var post = rbox(.14, 4.6, .14, .05, metal); post.position.set(x, 2.3, -1.7); g.add(post); });
    var bar = rbox(6.3, .1, .1, .04, metal); bar.position.set(0, 4.5, -1.7); g.add(bar);
    var counter = rbox(5.6, 1.1, 1.1, .08, std(0x9fa1a3, .7)); counter.position.set(0, .55, 1.55); g.add(counter);
    var top = rbox(5.8, .08, 1.3, .03, std(0xe6e7e8, .3)); top.position.set(0, 1.14, 1.55); g.add(top);
    if (id === "x") { // 폰팔이가 아닌 노점: 기념품 잡화 (금방 지나가는 배경이라 간단히, 봉에 걸린 열쇠고리 몇 개만)
      var mini = new T.ConeGeometry(.13, .45, 4), gold = std(0xc9a43a, .4);
      for (var h2 = 0; h2 < 5; h2++) { var kr = new T.Mesh(mini, gold); kr.position.set(-2.4 + h2 * 1.2, 4.1, -1.68); g.add(kr); }
      return g;
    }
    for (var h = 0; h < 7; h++) { // 위 봉에 걸린 상품 (케이스·파우치)
      var hang = rbox(.4, .64, .06, .05, std(PASTEL[(h * 3 + Math.floor(r() * 7)) % 7], .5)); hang.position.set(-2.7 + h * .9, 4.05, -1.68); g.add(hang);
    }
    for (var k = 0; k < 10; k++) { // 뒷판 진열 (폰 케이스 모양)
      var item = rbox(.42, .74, .07, .07, std(PASTEL[(k + Math.floor(r() * 7)) % 7], .45));
      var left = k < 5; item.position.set((left ? -2.7 : 1.1) + (k % 5 % 3) * .52, 2.6 - Math.floor((k % 5) / 3) * .9, -1.74); g.add(item);
    }
    for (var j = 0; j < 4; j++) { // 카운터 위 폰 상자
      var box = rbox(.5, .14, .32, .03, std([0x2b2d30, 0xffffff, col.getHex(), 0x8a8f96][j], .4)); box.position.set(-1.6 + j * 1.05, 1.25, 1.5); g.add(box);
    }
    if (id === "designer") { // 키링 볼 진열
      [0xff6a23, 0x3b43ef, 0xc5c7cf].forEach(function (c2, k2) { var b = new T.Mesh(new T.SphereGeometry(.16, 16, 12), std(c2, .3)); b.position.set(1.9 + k2 * .35, 1.36, 1.25); g.add(b); });
    }
    if (id === "safe") { // 필름 상자
      for (var f = 0; f < 3; f++) { var fb = rbox(.5, .7, .1, .03, std(0xdfe7f2, .3)); fb.position.set(1.6 + f * .45, 1.55, 1.3); fb.rotation.x = -.25; g.add(fb); }
    }
    g.traverse(function (o) { if (o.isMesh) o.receiveShadow = true; });
    return g;
  }

  /* ---------- 하늘 ---------- */
  function sky() {
    var geo = new T.SphereGeometry(1500, 32, 16), cols = [], p = geo.attributes.position, c = new T.Color();
    for (var i = 0; i < p.count; i++) {
      var t = Math.max(0, p.getY(i) / 1500);
      c.setHex(0xd7dde0).lerp(new T.Color(0x9fc4e3), Math.pow(t, .6)); cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
    return new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false }));
  }

  /* ---------- World ---------- */
  function World(canvas, site, opts) {
    var self = this; opts = opts || {};
    this.canvas = canvas; this.site = site; this.opts = opts;
    this.mobile = matchMedia("(max-width: 760px)").matches;
    // 휴대폰·태블릿(가로로 돌린 폰 포함)은 가벼운 설정: 그림자 없음, 군중 절반, 해상도 상한 1.5배
    this.lite = !opts.hq && (this.mobile || matchMedia("(pointer: coarse)").matches); // ?hq: 프리비즈 렌더용 (세로 화면에서도 그림자·군중 전체)
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var r = rng(20261120);
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: !!opts.preserve });
    this.dpr = Math.min(devicePixelRatio || 1, this.lite ? 1.5 : 1.75);
    renderer.setPixelRatio(this.dpr);
    this.renderer = renderer;
    var scene = new T.Scene(); this.scene = scene;
    // ?hq = 영상용 프리비즈: 유람선·간판 글자·만화 캐릭터는 빼고, 여행객은 노점 비율에 맞춰 키워서 둠
    this.hq = !!opts.hq;
    scene.fog = this.hq ? new T.Fog(0xc9dcea, 520, 1300) : new T.Fog(0xcfd8dc, 140, 900); // 프리비즈는 먼 지평선만 하늘색으로 흐림
    scene.add(sky());
    scene.add(new T.HemisphereLight(0xe8f1f8, 0x6d675f, .55));
    var sun = new T.DirectionalLight(0xfff4e6, .78); sun.position.set(-40, 70, 46); scene.add(sun);
    if (!this.lite) { // 장터 주변만 그림자 (탑 철골 그림자가 노점에 떨어지게)
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
      sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      var sc = sun.shadow.camera; sc.left = -34; sc.right = 34; sc.top = 34; sc.bottom = -34; sc.near = 10; sc.far = 220;
      sun.shadow.bias = -.0006; sun.shadow.normalBias = .02;
    }
    scene.add(new T.AmbientLight(0xffffff, .06));

    this.tower = buildTower(); scene.add(this.tower);
    var obs = new Obstacles(); this.obstacles = obs;
    var plaza = buildPlaza(r, obs); scene.add(plaza);
    this.boats = plaza.children[plaza.children.length - 1].userData.boats;
    if (this.hq) this.boats.forEach(function (bt) { bt.visible = false; });
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (s2) { obs.add(s2[0] * 17.6, s2[1] * 17.6, 5.4); }); // 탑 다리

    // 탑 아래 장터: 폰팔이 여섯 + 이름 없는 노점
    this.dealers = {}; this.hitTargets = [];
    DEALERS.forEach(function (id, i) {
      var d = site.dealers[id], p = dealerPos(i);
      var holder = new T.Group(); holder.position.copy(p); holder.lookAt(p.clone().add(dealerOut(i)));
      holder.add(buildBooth(id, d.color, r, self.hq ? null : d.short));
      var ch = buildDealer(id, d.color); holder.add(ch); if (self.hq) ch.visible = false;
      scene.add(holder);
      self.dealers[id] = { group: ch, holder: holder, index: i };
      ch.traverse(function (o) { if (o.isMesh) self.hitTargets.push(o); });
      obs.add(p.x, p.z, 4);
    });
    for (var i = 0; i < 0; i++) { // 탑 밑 둘레 기념품 노점: 지금은 두지 않음 (여섯 폰팔이만)
      var a = i / 10 * Math.PI * 2 + .12, rad = 17 + (i % 3) * 2.2;
      if (Math.abs(Math.cos(2 * a)) < .45) continue; // 다리 자리 비우기
      var b = buildBooth("x", PASTEL[i % 7], r); b.scale.setScalar(.75);
      b.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad); b.lookAt(0, 0, 0); scene.add(b);
      obs.add(b.position.x, b.position.z, 3.1);
    }
    this.crowd = buildCrowd(r, this.lite && !this.hq ? 160 : 320, obs, this.hq ? 2.6 : 1); scene.add(this.crowd);

    this.shots = buildShots();
    this.stopOf = {}; var so = this.stopOf; this.shots.forEach(function (sh, i) { if (sh.dealer) so[sh.dealer] = i; });
    var v = function (a) { return new T.Vector3().fromArray(a); };
    this.posCurve = new T.CatmullRomCurve3(this.shots.map(function (s) { return v(s.pos); }), false, "centripetal");
    this.lookCurve = new T.CatmullRomCurve3(this.shots.map(function (s) { return v(s.look); }), false, "centripetal");
    this.camera = new T.PerspectiveCamera(this.shots[0].fov, 1, .3, 3000);
    this.progress = 0; this.shown = -1; this.speed = 0; this.frames = 0; this.tick = 0;
    this.perf = { t: 0, n: 0, last: 0 }; this.slow = false; this.halfRate = false;
    this.offset = { x: 0, y: 0, tx: 0, ty: 0 };
    this.pointer = new T.Vector2(0, 0); this.ray = new T.Raycaster(); this.hover = null;
    this.prevPos = new T.Vector3();

    function aim(e) {
      var rc = canvas.getBoundingClientRect();
      self.pointer.set((e.clientX - rc.left) / rc.width * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
    }
    canvas.addEventListener("pointermove", function (e) { aim(e); self.pick(); });
    canvas.addEventListener("pointerdown", function (e) { self.touchy = e.pointerType !== "mouse"; });
    // 탭은 pointermove 없이 올 수 있어 클릭 위치로 다시 겨눔. 터치는 호버가 없으니 탭하면 잠깐 깡충 반응
    canvas.addEventListener("click", function (e) {
      aim(e); self.pick();
      if (self.touchy && self.hover) {
        clearTimeout(self.tapT);
        self.tapT = setTimeout(function () { if (self.hover) { self.hover = null; if (opts.onHover) opts.onHover(null); } }, 1300);
      }
      if (self.hover && opts.onDealer) opts.onDealer(self.hover);
    });
    canvas.addEventListener("pointerleave", function () { // 캔버스를 벗어나면 호버 해제
      if (self.hover) { self.hover = null; canvas.style.cursor = ""; if (opts.onHover) opts.onHover(null); }
    });

    this.resize();
    this.clock = new T.Clock();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  World.prototype.pick = function () {
    this.ray.setFromCamera(this.pointer, this.camera);
    var hit = this.ray.intersectObjects(this.hitTargets, false)[0];
    var prev = this.hover;
    this.hover = hit && hit.distance < 40 ? hit.object.userData.dealer : null;
    this.canvas.style.cursor = this.hover ? "pointer" : "";
    if (prev !== this.hover && this.opts.onHover) this.opts.onHover(this.hover);
  };

  World.prototype.resize = function () {
    var w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.mobile = matchMedia("(max-width: 760px)").matches;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  };

  // s: 0 ~ (장면 수 - 1). 정수에서 해당 장면에 정확히 멈춤
  World.prototype.setProgress = function (s) { this.progress = Math.max(0, Math.min(this.shots.length - 1, s)); };
  // 카드가 화면을 가릴 때 피사체를 옆/위로 비켜 주는 오프셋 (화면 비율)
  World.prototype.setFrameOffset = function (x, y) { this.offset.tx = x; this.offset.ty = y; };

  World.prototype.placeCamera = function () {
    var n = this.shots.length - 1, s = this.progress, i = Math.min(n - 1, Math.floor(s)), f = s - i;
    var t = (i + ease(Math.min(1, f))) / n;
    var cam = this.camera;
    cam.position.copy(this.posCurve.getPoint(t));
    cam.lookAt(this.lookCurve.getPoint(t));
    var a = this.shots[i], b = this.shots[Math.min(n, i + 1)];
    var fov = lerp(a.fov, b.fov, ease(f));
    if (this.mobile) fov = Math.min(80, fov * 1.32); // 세로 화면은 화각을 넓혀 영상과 같은 구도
    if (Math.abs(cam.fov - fov) > .01) { cam.fov = fov; }
    var o = this.offset; o.x += (o.tx - o.x) * .12; o.y += (o.ty - o.y) * .12;
    var w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (Math.abs(o.x) > .001 || Math.abs(o.y) > .001) cam.setViewOffset(w, h, -o.x * w, -o.y * h, w, h); else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  };

  World.prototype.animate = function (dt, time) {
    if (this.reduced) return;
    // 군중 걷기: 다음 걸음이 장애물에 닿으면 멈추고 방향을 틂
    var cd = this.crowd.userData, ppl = cd.people, obs = this.obstacles, m = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), pos = new T.Vector3();
    for (var i = 0; i < ppl.length; i++) {
      var p = ppl[i];
      if (p.turn > 0) { p.h += p.turnDir * 2.4 * dt; p.turn -= dt; }
      else p.h += Math.sin(time * .3 + i) * .4 * dt;
      var nx = p.x + Math.cos(p.h) * p.v * dt, nz = p.z + Math.sin(p.h) * p.v * dt, d = Math.hypot(nx, nz);
      if (!walkable(nx, nz)) { p.h += Math.PI; }
      else if (obs.hit(nx, nz, .35 * cd.cs)) { if (p.turn <= 0) { p.turn = .5 + Math.random() * .6; p.turnDir = Math.random() < .5 ? -1 : 1; } }
      else { p.x = nx; p.z = nz; }
      var bob = Math.abs(Math.sin(time * 6 * p.v / cd.cs + i)) * .05 * cd.cs;
      q.setFromAxisAngle(UP, -p.h); sc.set(cd.cs, p.s * cd.cs, cd.cs); pos.set(p.x, bob, p.z);
      m.compose(pos, q, sc); cd.bodies.setMatrixAt(i, m); cd.heads.setMatrixAt(i, m);
    }
    cd.bodies.instanceMatrix.needsUpdate = true; cd.heads.instanceMatrix.needsUpdate = true;
    this.boats.forEach(function (b) { b.position.x = ((time * 3 * b.userData.dir + b.userData.off) % 1200 + 1200) % 1200 - 600; b.rotation.y = b.userData.dir < 0 ? Math.PI : 0; }); // 유람선
    // 캐릭터: 폰팔이마다 다른 호객 동작 + 마우스 올리면 반응 + 깜빡임·시선
    var px = this.pointer.x, py = this.pointer.y, prog = this.progress;
    for (var id in this.dealers) {
      var D = this.dealers[id], g = D.group, k = D.index, u = g.userData, talk = this.talking === id, S = TOUT[id];
      var near = Math.max(0, 1 - Math.abs(prog - this.stopOf[id]) * 1.6);
      var market = Math.max(0, 1 - Math.abs(prog - 2) * 1.6) * .7;
      var ts = talk ? 1 : Math.max(near, market, this.hover === id ? 1 : 0); // 호객 세기
      var ph = ((time + k * .83) % S.period) / S.dur;                        // 제스처 진행 (0~1이면 동작 중)
      var env = ph < 1 ? Math.sin(ph * Math.PI) : 0;
      if (talk) { env = .75 + Math.sin(time * S.talk) * .25; ph = (time * S.talk / 6) % 1; }
      env *= ts; u.env = env; u.ph = ph;
      // 기본 자세로 되돌린 뒤 동작을 얹음
      g.position.y = Math.sin(time * 1.6 + k) * .05; g.rotation.set(0, Math.sin(time * .7 + k) * .06, 0); g.scale.set(1, 1, 1);
      u.arms.forEach(function (a) { a.rotation.set(0, 0, 0); });
      u.eyeGroups.forEach(function (e) { e.scale.set(1, 1, 1); });
      u.look = 0;
      STYLE[id](g, u, env, ph, time, dt, talk);
      // 마우스 올리면: 깡충 + 흔들 + 은은한 빛
      if (this.hover === id) { if (u.hoverAt == null) u.hoverAt = time; } else u.hoverAt = null;
      if (u.hoverAt != null) {
        var r = Math.min(1, (time - u.hoverAt) / .65);
        g.position.y += Math.sin(r * Math.PI) * .55; g.rotation.y += Math.sin(r * Math.PI * 3) * .22 * (1 - r);
        g.scale.multiplyScalar(1 + .05 * Math.sin(r * Math.PI));
      }
      u.glow += ((this.hover === id ? .24 : 0) - u.glow) * .15;
      u.body.material.emissive.copy(u.col).multiplyScalar(u.glow);
      // 깜빡임
      u.blink -= dt;
      var e = u.eyes;
      if (u.blink < 0) { e.scale.y = Math.max(.08, e.scale.y - dt * 18); if (u.blink < -.12) { u.blink = 2 + Math.random() * 3.5; } }
      else e.scale.y = Math.min(1, e.scale.y + dt * 14);
      // 시선: 마우스를 따라봄 (+ 자린고비는 두리번)
      u.pupils.forEach(function (pu) {
        var b = pu.userData.base;
        pu.position.x += (b.x + px * .075 + u.look - pu.position.x) * .15;
        pu.position.y += (b.y + py * .065 - pu.position.y) * .15;
      });
    }
  };

  // 폰팔이별 호객 동작 (env: 0~1 동작 세기, ph: 0~1 동작 진행)
  var TOUT = {
    designer: { period: 4.2, dur: 1.8, talk: 6 },
    quick: { period: 2.6, dur: 1.1, talk: 14 },
    price: { period: 3.6, dur: 1.5, talk: 8 },
    safe: { period: 5.0, dur: 2.0, talk: 3 },
    used: { period: 3.8, dur: 1.6, talk: 7 },
    allinone: { period: 4.6, dur: 2.2, talk: 4 },
  };
  var STYLE = {
    designer: function (g, u, env, ph, t) { // 긴 팔로 진열 케이스를 소개 + 한 바퀴 뽐내기 + 윙크
      g.rotation.z = Math.sin(t * 1.3) * .035;
      u.arms[0].rotation.z = env * .95 + Math.sin(t * 5) * .12 * env;
      g.rotation.y += env * .45 * Math.sin(ph * Math.PI * 2);
      if (env > .55) u.eyeGroups[1].scale.y = Math.max(.12, 1 - (env - .55) * 4);
    },
    quick: function (g, u, env, ph, t, dt) { // 깡충깡충 두 번 + 팔을 번쩍 들고 빠르게 손짓 + 손수레 바퀴
      g.position.y += Math.abs(Math.sin(t * 7)) * .06 + (ph < 1 ? Math.abs(Math.sin(ph * Math.PI * 2)) * .55 * Math.min(1, env * 1.6) : 0);
      u.arms[0].rotation.z = env * 1.9 + Math.sin(t * 20) * .35 * env;
      if (u.wheel) u.wheel.rotation.z += dt * (2 + 12 * env);
    },
    price: function (g, u, env, ph, t) { // 0원 가격표를 흔들며 몸을 숙여 속삭임 + 두리번
      g.rotation.x = Math.sin(t * .9) * .03 + .12 * env;
      u.arms[0].rotation.z = .25 * env + Math.sin(t * 16) * .3 * env;
      u.look = Math.sin(t * 4) * .09 * env;
    },
    safe: function (g, u, env, ph, t) { // 든든하게 두 번 끄덕 + 두 팔 벌려 지켜주기 + 방패가 빛남
      g.scale.y *= 1 + Math.sin(t * 1.6) * .012;
      g.rotation.x = Math.sin(ph * Math.PI * 4) * .07 * env;
      u.arms[0].rotation.z = env * .55; u.arms[1].rotation.z = -env * .55;
      if (u.shield) u.shield.material.emissive.setRGB(env * .45, env * .5, env * .6);
    },
    used: function (g, u, env, ph, t) { // S급 팻말을 경매처럼 들었다 놨다 + 한쪽 눈이 돋보기처럼 커짐
      g.rotation.z = Math.sin(t * 1.1) * .03 - env * .06;
      u.arms[0].rotation.z = env * .5 + Math.sin(t * 9) * .18 * env;
      u.eyeGroups[0].scale.setScalar(1 + .45 * env);
    },
    allinone: function (g, u, env, ph, t) { // 달걀처럼 뒤뚱 + 두 팔 활짝 흔들며 "다 맡겨"
      g.rotation.z = Math.sin(t * 1.4) * .05 + Math.sin(t * 3) * .08 * env;
      g.position.y += env * .12;
      var w = Math.sin(t * 5) * .35 * env + .2 * env;
      u.arms[0].rotation.z = w; u.arms[1].rotation.z = -w;
    },
  };

  World.prototype.loop = function () {
    requestAnimationFrame(this.loop);
    var pf = this.perf, now = performance.now();
    if (document.hidden || this.paused) { pf.last = 0; return; } // 숨겨졌던 시간은 재지 않음
    var gap = pf.last ? (now - pf.last) / 1000 : 0; pf.last = now;
    // 느린 기기: 2초 구간 평균이 30fps 아래인 구간이 두 번 이어지면 해상도를 한 단계(0.25배)씩 낮춤, 1배 아래로는 안 내림
    // (한 번 끊기는 것만으로는 안 내림. 아주 느린 기기도 재도록 프레임 간격 상한은 2초)
    if (gap > 0 && gap < 2 && this.clock.elapsedTime > 3) {
      pf.t += gap; pf.n++;
      if (pf.t > 2) {
        pf.bad = pf.t / pf.n > 1 / 30 ? (pf.bad || 0) + 1 : 0;
        if (pf.bad >= 2 && this.dpr > 1) { this.dpr = Math.max(1, this.dpr - .25); this.renderer.setPixelRatio(this.dpr); this.resize(); this.slow = true; pf.bad = 0; }
        pf.t = 0; pf.n = 0;
      }
    }
    // 가게가 화면을 덮는 동안 휴대폰은 절반 속도로만 그림 (배터리·발열)
    this.tick = (this.tick + 1) | 0;
    if (this.lite && this.halfRate && (this.tick & 1)) return;
    var dt = Math.min(.05, this.clock.getDelta()), time = this.clock.elapsedTime;
    this.placeCamera();
    // 카메라 속도 → 모션 블러 (영상의 휙 지나가는 전환)
    var sp = this.camera.position.distanceTo(this.prevPos) / Math.max(dt, .001);
    this.prevPos.copy(this.camera.position);
    var dist = Math.max(4, this.camera.position.length() * .2);
    this.speed += (Math.min(1, sp / dist / 6) - this.speed) * .25;
    var blur = this.reduced || this.slow ? 0 : Math.max(0, this.speed - .12) * (this.lite ? 5 : 9); // 휴대폰은 블러를 약하게
    this.canvas.style.filter = blur > .3 ? "blur(" + blur.toFixed(1) + "px)" : "";
    this.animate(dt, time);
    this.renderer.render(this.scene, this.camera);
    this.frames++;
  };

  World.prototype.talk = function (id) { this.talking = id || null; };
  World.prototype.toutEnv = function (id) { var d = this.dealers[id]; return d ? d.group.userData.env : 0; };

  // 캐릭터 머리 위 말풍선 위치 (화면 px)
  World.prototype.headOnScreen = function (id) {
    var d = this.dealers[id]; if (!d) return null;
    var p = new T.Vector3(0, 5.2, 0); d.group.localToWorld(p);
    p.project(this.camera);
    return { x: (p.x + 1) / 2 * this.canvas.clientWidth, y: (1 - p.y) / 2 * this.canvas.clientHeight, front: p.z < 1 };
  };

  World.prototype.info = function () {
    return { frames: this.frames, segments: this.tower.userData.segments, shots: this.shots.length, progress: this.progress, cam: this.camera.position.toArray() };
  };

  World.supported = function () {
    try { var c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); } catch (e) { return false; }
  };
  World.DEALERS = DEALERS;
  window.PPWorld = World;
})();
