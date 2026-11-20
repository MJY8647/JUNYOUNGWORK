/* 폰파리 3D 월드 — 에펠탑 광장, 군중, 노점, 여섯 폰팔이, 스크롤 카메라.
 * 모두 코드로 만든 절차적 모델입니다(외부 3D 파일 없음). three.js r128 전역 THREE 사용.
 */
(function () {
  "use strict";
  var T = window.THREE;

  // 영상의 카메라 구도를 장면 순서대로 (pos, look, fov)
  var DEALERS = ["designer", "quick", "price", "safe", "used", "allinone"];
  var DEALER_R = 10.5;
  function dealerAngle(i) { return Math.PI / 2 + (i - 2.5) * (Math.PI / 3.4); }
  function dealerPos(i) { var a = dealerAngle(i); return new T.Vector3(Math.cos(a) * DEALER_R, 0, Math.sin(a) * DEALER_R); }

  function buildShots() {
    var s = [
      { pos: [0, 150, 330], look: [0, 42, 0], fov: 38 },   // 광장 전경
      { pos: [10, 175, 52], look: [0, 0, 6], fov: 46 },    // 탑 위에서 내려다보기
      { pos: [0, 4.5, 36], look: [0, 10, 0], fov: 55 },    // 아치 아래 노점
    ];
    DEALERS.forEach(function (id, i) {
      var p = dealerPos(i), dir = p.clone().setY(0).normalize();
      var cam = p.clone().sub(dir.clone().multiplyScalar(7.6)); cam.y = 3.2;
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

  function buildPlaza(r) {
    var g = new T.Group();
    var ground = new T.Mesh(new T.PlaneGeometry(2400, 2400), new T.MeshStandardMaterial({ color: 0x8d8c88, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
    // 격자 타일 블록 (첫 장면의 광장 패턴)
    var pts = [];
    for (var x = -440; x <= 440; x += 9) for (var z = -520; z <= 440; z += 9) {
      var d = Math.hypot(x, z); if (d < 75 || Math.abs(x) < 26) continue;
      if (((Math.floor(x / 63) + Math.floor(z / 63)) & 3) === 0) continue; // 블록 사이 길
      pts.push([x, z]);
    }
    var tile = new T.InstancedMesh(new T.BoxGeometry(7.4, .5, 7.4), new T.MeshStandardMaterial({ color: 0x9c9c99, roughness: .95 }), pts.length);
    var m = new T.Matrix4(), c = new T.Color();
    pts.forEach(function (p, i) {
      m.makeTranslation(p[0], .25, p[1]); tile.setMatrixAt(i, m);
      tile.setColorAt(i, c.setHex(0x9c9c99).offsetHSL(0, 0, (r() - .5) * .05));
    });
    g.add(tile);
    // 파스텔 노점 (탑 주변 흩어진 가게)
    var n = 240, base = new T.InstancedMesh(new T.BoxGeometry(2.6, 1.7, 1.8), new T.MeshStandardMaterial({ color: 0xffffff, roughness: .8 }), n);
    var roof = new T.InstancedMesh(new T.BoxGeometry(3.1, .35, 2.4), new T.MeshStandardMaterial({ color: 0xffffff, roughness: .7 }), n);
    var q = new T.Quaternion(), e = new T.Euler(), sc = new T.Vector3(1, 1, 1);
    for (var i = 0; i < n; i++) {
      var a = r() * Math.PI * 2, rad = 26 + Math.pow(r(), .8) * 92, px = Math.cos(a) * rad, pz = Math.sin(a) * rad;
      e.set(0, r() * Math.PI, 0); q.setFromEuler(e);
      m.compose(new T.Vector3(px, .85, pz), q, sc); base.setMatrixAt(i, m);
      e.set(.18, e.y, 0); q.setFromEuler(e);
      m.compose(new T.Vector3(px, 1.9, pz), q, sc); roof.setMatrixAt(i, m);
      var col = PASTEL[i % PASTEL.length];
      base.setColorAt(i, c.setHex(col).lerp(new T.Color(0xffffff), .35)); roof.setColorAt(i, c.setHex(col));
    }
    g.add(base, roof);
    return g;
  }

  function buildCrowd(r, n) {
    var geo = new T.CylinderGeometry(.24, .3, 1.7, 6); geo.translate(0, .85, 0);
    var mesh = new T.InstancedMesh(geo, new T.MeshStandardMaterial({ color: 0xffffff, roughness: .9 }), n);
    var people = [], c = new T.Color(), tones = [0x30343a, 0x3d4148, 0x585c63, 0x2a2d31, 0x6c6258, 0x45505c];
    for (var i = 0; i < n; i++) {
      var a = r() * Math.PI * 2, rad = 15 + Math.pow(r(), .7) * 110;
      people.push({ x: Math.cos(a) * rad, z: Math.sin(a) * rad, h: r() * Math.PI * 2, v: .6 + r() * .9, s: .9 + r() * .25 });
      mesh.setColorAt(i, c.setHex(tones[i % tones.length]));
    }
    mesh.userData.people = people;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    return mesh;
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
  function eyes(group, y, z, gap, size) {
    var white = new T.MeshStandardMaterial({ color: 0xffffff, roughness: .18 }), black = new T.MeshStandardMaterial({ color: 0x0c0c0e, roughness: .12, metalness: .2 });
    var shine = new T.MeshBasicMaterial({ color: 0xffffff });
    var pair = new T.Group(); pair.position.set(0, y, z);
    var pupils = [];
    [-1, 1].forEach(function (s) {
      var eye = new T.Mesh(new T.SphereGeometry(size, 28, 20), white); eye.scale.z = .6; eye.position.x = s * gap; pair.add(eye);
      var p = new T.Group(); p.position.set(s * gap, 0, size * .5); p.userData.base = p.position.clone();
      var pu = new T.Mesh(new T.SphereGeometry(size * .5, 20, 14), black); pu.scale.z = .5; p.add(pu);
      var hl = new T.Mesh(new T.SphereGeometry(size * .13, 10, 8), shine); hl.position.set(-size * .17, size * .17, size * .2); p.add(hl);
      pair.add(p); pupils.push(p);
    });
    group.add(pair); group.userData.eyes = pair; group.userData.pupils = pupils;
  }
  function limb(group, from, to, color, r, hand) { // 캡슐 팔 + 공 손
    var a = new T.Vector3().fromArray(from), b = new T.Vector3().fromArray(to);
    var len = a.distanceTo(b), mat = std(color, .55);
    var mesh = new T.Mesh(new T.CylinderGeometry(r, r, len, 18), mat); mesh.castShadow = true;
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
    var j = new T.Mesh(new T.SphereGeometry(r, 16, 12), mat); j.position.copy(a);
    var end = new T.Mesh(new T.SphereGeometry(r * (hand || 1.3), 20, 14), mat); end.position.copy(b); end.castShadow = true;
    group.add(mesh, j, end); return end;
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
      var wheel = new T.Mesh(new T.TorusGeometry(.48, .2, 14, 28), std(0x18191b, .8)); wheel.position.set(-2.1, .62, .9); wheel.rotation.y = Math.PI / 2; wheel.castShadow = true; g.add(wheel);
      [[1.2, .8, .9, 1.4], [1.0, .7, .8, 2.15]].forEach(function (b) { var bx = rbox(b[0], b[1], b[2], .05, std(0xc99a62, .9)); bx.position.set(-2.1, b[3], .4); g.add(bx); });
    } else if (id === "price") { // 카키 원뿔 + 가격표
      body = lathe([[0, 0], [1.18, 0], [1.12, .2], [.2, 4.05], [.08, 4.25], [0, 4.3]], m, 48);
      body.rotation.z = -.06;
      eyes(g, 2.15, .72, .26, .2);
      var hand = limb(g, [.6, 1.9, .3], [1.45, 2.75, .55], 0xb3b483, .17);
      var tag = plate(.8, .5, textTex([{ t: "0원", s: 70 }], "#d8263a", "#fffdf2", 192, 120)); tag.position.copy(hand.position).add(new T.Vector3(.1, .45, .05)); g.add(tag);
    } else if (id === "safe") { // 남색 상자 + 두 팔 + 방패
      body = rbox(2.75, 3.4, 1.3, .2, m); body.position.y = 1.7;
      eyes(g, 2.85, .7, .34, .21);
      limb(g, [1.35, 2.3, 0], [2.15, .95, .55], 0x55669a, .21); limb(g, [-1.35, 2.3, 0], [-2.05, 1.25, .45], 0x55669a, .21);
      var sh = new T.Shape(); sh.moveTo(0, .5); sh.quadraticCurveTo(.45, .45, .5, .35); sh.lineTo(.42, -.15); sh.quadraticCurveTo(.25, -.45, 0, -.6); sh.quadraticCurveTo(-.25, -.45, -.42, -.15); sh.lineTo(-.5, .35); sh.quadraticCurveTo(-.45, .45, 0, .5);
      var shield = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: .08, bevelEnabled: true, bevelSize: .03, bevelThickness: .03 }), std(0xe8edf5, .35)); shield.position.set(0, 1.5, .67); g.add(shield);
    } else if (id === "used") { // 버건디 기둥 + S급 팻말
      body = rbox(1.05, 4.6, .9, .14, m); body.position.y = 2.3;
      eyes(g, 3.9, .48, .23, .2);
      var h2 = limb(g, [.52, 3.1, 0], [1.15, 4.05, .4], 0xb54d69, .15);
      var sign = rbox(1.0, .66, .06, .04, std(0xffffff)); sign.position.copy(h2.position).add(new T.Vector3(.25, .55, .02)); sign.rotation.z = .25; g.add(sign);
      var st = plate(.9, .56, textTex([{ t: "S급", s: 78 }], "#9c3a55", "#ffffff", 192, 120)); st.position.copy(sign.position).add(new T.Vector3(0, 0, .04)); st.rotation.z = .25; g.add(st);
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
    for (var h = 0; h < 7; h++) { // 위 봉에 걸린 상품 (케이스·파우치)
      var hang = rbox(.4, .64, .06, .05, std(PASTEL[(h * 3 + Math.floor(r() * 7)) % 7], .5)); hang.position.set(-2.7 + h * .9, 4.05, -1.68); g.add(hang);
    }
    var counter = rbox(5.6, 1.1, 1.1, .08, std(0x9fa1a3, .7)); counter.position.set(0, .55, 1.55); g.add(counter);
    var top = rbox(5.8, .08, 1.3, .03, std(0xe6e7e8, .3)); top.position.set(0, 1.14, 1.55); g.add(top);
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
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var r = rng(20261120);
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: !!opts.preserve });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.mobile ? 1.5 : 1.75));
    this.renderer = renderer;
    var scene = new T.Scene(); this.scene = scene;
    scene.fog = new T.Fog(0xcfd8dc, 140, 900);
    scene.add(sky());
    scene.add(new T.HemisphereLight(0xe8f1f8, 0x6d675f, .55));
    var sun = new T.DirectionalLight(0xfff4e6, .78); sun.position.set(-40, 70, 46); scene.add(sun);
    if (!this.mobile) { // 장터 주변만 그림자 (탑 철골 그림자가 노점에 떨어지게)
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
      sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      var sc = sun.shadow.camera; sc.left = -34; sc.right = 34; sc.top = 34; sc.bottom = -34; sc.near = 10; sc.far = 220;
      sun.shadow.bias = -.0006; sun.shadow.normalBias = .02;
    }
    scene.add(new T.AmbientLight(0xffffff, .06));

    this.tower = buildTower(); scene.add(this.tower);
    scene.add(buildPlaza(r));
    this.crowd = buildCrowd(r, this.mobile ? 1300 : 2600); scene.add(this.crowd);

    // 탑 아래 장터: 폰팔이 여섯 + 이름 없는 노점
    this.dealers = {}; this.hitTargets = [];
    DEALERS.forEach(function (id, i) {
      var d = site.dealers[id], p = dealerPos(i);
      var holder = new T.Group(); holder.position.copy(p); holder.lookAt(0, 0, 0);
      holder.add(buildBooth(id, d.color, r, d.short));
      var ch = buildDealer(id, d.color); holder.add(ch);
      scene.add(holder);
      self.dealers[id] = { group: ch, holder: holder, index: i };
      ch.traverse(function (o) { if (o.isMesh) self.hitTargets.push(o); });
    });
    for (var i = 0; i < 26; i++) { // 탑 밑 둘레 노점
      var a = i / 26 * Math.PI * 2 + .12, rad = 17 + (i % 3) * 2.2;
      if (Math.abs(Math.cos(2 * a)) < .45) continue; // 다리 자리 비우기
      var b = buildBooth("x", PASTEL[i % 7], r); b.scale.setScalar(.75);
      b.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad); b.lookAt(0, 0, 0); scene.add(b);
    }

    this.shots = buildShots();
    var v = function (a) { return new T.Vector3().fromArray(a); };
    this.posCurve = new T.CatmullRomCurve3(this.shots.map(function (s) { return v(s.pos); }), false, "centripetal");
    this.lookCurve = new T.CatmullRomCurve3(this.shots.map(function (s) { return v(s.look); }), false, "centripetal");
    this.camera = new T.PerspectiveCamera(this.shots[0].fov, 1, .3, 3000);
    this.progress = 0; this.shown = -1; this.speed = 0; this.frames = 0;
    this.offset = { x: 0, y: 0, tx: 0, ty: 0 };
    this.pointer = new T.Vector2(0, 0); this.ray = new T.Raycaster(); this.hover = null;
    this.prevPos = new T.Vector3();

    canvas.addEventListener("pointermove", function (e) {
      var rc = canvas.getBoundingClientRect();
      self.pointer.set((e.clientX - rc.left) / rc.width * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
      self.pick();
    });
    canvas.addEventListener("click", function () { self.pick(); if (self.hover && opts.onDealer) opts.onDealer(self.hover); });

    this.resize();
    this.clock = new T.Clock();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  World.prototype.pick = function () {
    this.ray.setFromCamera(this.pointer, this.camera);
    var hit = this.ray.intersectObjects(this.hitTargets, false)[0];
    this.hover = hit && hit.distance < 40 ? hit.object.userData.dealer : null;
    this.canvas.style.cursor = this.hover ? "pointer" : "";
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
    // 군중 걷기
    var crowd = this.crowd, ppl = crowd.userData.people, m = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), pos = new T.Vector3();
    for (var i = 0; i < ppl.length; i++) {
      var p = ppl[i];
      p.h += (Math.sin(time * .3 + i) * .4) * dt;
      p.x += Math.cos(p.h) * p.v * dt; p.z += Math.sin(p.h) * p.v * dt;
      var d = Math.hypot(p.x, p.z);
      if (d < 14 || d > 130) p.h += Math.PI;
      var bob = Math.abs(Math.sin(time * 6 * p.v + i)) * .06;
      q.setFromAxisAngle(UP, -p.h); sc.set(1, p.s, 1); pos.set(p.x, bob, p.z);
      crowd.setMatrixAt(i, m.compose(pos, q, sc));
    }
    crowd.instanceMatrix.needsUpdate = true;
    // 캐릭터: 숨쉬기, 눈 깜빡임, 시선
    var px = this.pointer.x, py = this.pointer.y;
    for (var id in this.dealers) {
      var g = this.dealers[id].group, k = this.dealers[id].index;
      var talk = this.talking === id;
      g.position.y = talk ? Math.abs(Math.sin(time * 9)) * .12 : Math.sin(time * 1.6 + k) * .05;
      g.scale.y = talk ? 1 + Math.sin(time * 18) * .015 : 1;
      g.rotation.y = Math.sin(time * .7 + k) * .06;
      g.userData.blink -= dt;
      var e = g.userData.eyes;
      if (g.userData.blink < 0) { e.scale.y = Math.max(.08, e.scale.y - dt * 18); if (g.userData.blink < -.12) { g.userData.blink = 2 + Math.random() * 3.5; } }
      else e.scale.y = Math.min(1, e.scale.y + dt * 14);
      g.userData.pupils.forEach(function (pu) {
        var b = pu.userData.base;
        pu.position.x += (b.x + px * .075 - pu.position.x) * .15;
        pu.position.y += (b.y + py * .065 - pu.position.y) * .15;
      });
    }
  };

  World.prototype.loop = function () {
    requestAnimationFrame(this.loop);
    if (document.hidden || this.paused) return;
    var dt = Math.min(.05, this.clock.getDelta()), time = this.clock.elapsedTime;
    this.placeCamera();
    // 카메라 속도 → 모션 블러 (영상의 휙 지나가는 전환)
    var sp = this.camera.position.distanceTo(this.prevPos) / Math.max(dt, .001);
    this.prevPos.copy(this.camera.position);
    var dist = Math.max(4, this.camera.position.length() * .2);
    this.speed += (Math.min(1, sp / dist / 6) - this.speed) * .25;
    var blur = this.reduced ? 0 : Math.max(0, this.speed - .12) * 9;
    this.canvas.style.filter = blur > .3 ? "blur(" + blur.toFixed(1) + "px)" : "";
    this.animate(dt, time);
    this.renderer.render(this.scene, this.camera);
    this.frames++;
  };

  World.prototype.talk = function (id) { this.talking = id || null; };

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
