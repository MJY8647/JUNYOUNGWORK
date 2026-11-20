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
    function S(a, b, w) { segs.push([a, b, w]); }
    function face(p0, p1, q0, q1, w) { S(p0, q1, w); S(p1, q0, w); }  // X 브레이싱
    var y, k;
    // 네 다리 (2층까지)
    [-1, 1].forEach(function (sx) {
      [-1, 1].forEach(function (sz) {
        var prev = null;
        for (y = 0; y <= 38.5 + .01; y += 2.2) {
          var o = hw(y), n = o - legT(y);
          var c = [V(sx * o, y, sz * o), V(sx * n, y, sz * o), V(sx * n, y, sz * n), V(sx * o, y, sz * n)];
          for (k = 0; k < 4; k++) S(c[k], c[(k + 1) % 4], .26);
          if (prev) for (k = 0; k < 4; k++) { S(prev[k], c[k], .5); face(prev[k], prev[(k + 1) % 4], c[k], c[(k + 1) % 4], .16); }
          prev = c;
        }
      });
    });
    // 몸통 (2층 → 꼭대기)
    var prev = null;
    for (y = 38.5; y <= 92.01; y += 2.6) {
      var h = hw(y), c = [V(h, y, h), V(-h, y, h), V(-h, y, -h), V(h, y, -h)];
      for (k = 0; k < 4; k++) S(c[k], c[(k + 1) % 4], .22);
      if (prev) for (k = 0; k < 4; k++) { S(prev[k], c[k], lerp(.45, .2, (y - 38.5) / 54)); face(prev[k], prev[(k + 1) % 4], c[k], c[(k + 1) % 4], .12); }
      prev = c;
    }
    // 아치 네 면
    for (var side = 0; side < 4; side++) {
      var rot = side * Math.PI / 2, arcs = [[], []];
      for (var a = 0; a <= 28; a++) {
        var th = Math.PI * a / 28, R = 11.6;
        for (var l = 0; l < 2; l++) {
          var x = Math.cos(th) * R, yy = 5 + Math.sin(th) * (12.2 - l * 1.1), z = 13.4 + (l ? -.9 : 0);
          arcs[l].push(V(x * Math.cos(rot) - z * Math.sin(rot), yy, x * Math.sin(rot) + z * Math.cos(rot)));
        }
      }
      for (a = 1; a < arcs[0].length; a++) {
        S(arcs[0][a - 1], arcs[0][a], .42); S(arcs[1][a - 1], arcs[1][a], .3);
        if (a % 2) S(arcs[0][a], arcs[1][a], .14);
      }
    }
    var geo = new T.BoxGeometry(1, 1, 1);
    var mat = new T.MeshStandardMaterial({ color: 0x5f4b39, roughness: .85, metalness: .15 });
    var mesh = new T.InstancedMesh(geo, mat, segs.length), m = new T.Matrix4();
    segs.forEach(function (s, i) { mesh.setMatrixAt(i, segMatrix(s[0], s[1], s[2], m)); });
    var g = new T.Group(); g.add(mesh);
    // 전망대 바닥, 꼭대기, 안테나
    var deck = new T.MeshStandardMaterial({ color: 0x4e3e30, roughness: .9 });
    [[19, hw(19) * 2 + 3.2, 1.4], [38.5, hw(38.5) * 2 + 2, 1]].forEach(function (d) {
      var b = new T.Mesh(new T.BoxGeometry(d[1], d[2], d[1]), deck); b.position.y = d[0]; g.add(b);
      var rail = new T.Mesh(new T.BoxGeometry(d[1] + .6, .9, d[1] + .6), new T.MeshStandardMaterial({ color: 0x6b5644, transparent: true, opacity: .55 }));
      rail.position.y = d[0] + 1.1; g.add(rail);
    });
    var top = new T.Mesh(new T.BoxGeometry(3.2, 3.4, 3.2), deck); top.position.y = 92.5; g.add(top);
    var ant = new T.Mesh(new T.CylinderGeometry(.18, .3, 10, 6), deck); ant.position.y = 99; g.add(ant);
    g.userData.segments = segs.length;
    return g;
  }

  /* ---------- 광장 타일, 노점, 군중 ---------- */
  var PASTEL = [0x9fd8cf, 0xf2a7b5, 0xc7b5ea, 0xf4d36b, 0x8fc9e8, 0xb8e0a0, 0xf6b98a];

  function buildPlaza(r) {
    var g = new T.Group();
    var ground = new T.Mesh(new T.PlaneGeometry(2400, 2400), new T.MeshStandardMaterial({ color: 0x8d8c88, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; g.add(ground);
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

  /* ---------- 폰팔이 캐릭터 ---------- */
  function std(color, rough) { return new T.MeshStandardMaterial({ color: color, roughness: rough == null ? .75 : rough }); }
  function eyes(group, y, z, gap, size) {
    var white = new T.MeshStandardMaterial({ color: 0xffffff, roughness: .3 }), black = std(0x111111, .2);
    var pair = new T.Group(); pair.position.set(0, y, z);
    var pupils = [];
    [-1, 1].forEach(function (s) {
      var eye = new T.Mesh(new T.SphereGeometry(size, 20, 14), white); eye.scale.z = .55; eye.position.x = s * gap; pair.add(eye);
      var p = new T.Mesh(new T.SphereGeometry(size * .48, 16, 10), black); p.position.set(s * gap, 0, size * .5); p.userData.base = p.position.clone(); pair.add(p); pupils.push(p);
    });
    group.add(pair); group.userData.eyes = pair; group.userData.pupils = pupils;
  }
  function arm(group, from, to, color, r) {
    var a = new T.Vector3().fromArray(from), b = new T.Vector3().fromArray(to);
    var len = a.distanceTo(b), mesh = new T.Mesh(new T.CylinderGeometry(r, r, len, 12), std(color));
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
    var end = new T.Mesh(new T.SphereGeometry(r * 1.25, 14, 10), std(color)); end.position.copy(b);
    group.add(mesh, end);
  }

  function buildDealer(id, colorHex) {
    var g = new T.Group(), body, col = new T.Color(colorHex).getHex();
    if (id === "designer") {
      body = new T.Mesh(new T.CylinderGeometry(.72, .72, 4.4, 28), std(col)); body.position.y = 2.2;
      eyes(g, 3.85, .66, .27, .2); arm(g, [.7, 2.4, .2], [1.35, 1.1, .7], col, .17);
    } else if (id === "quick") {
      body = new T.Mesh(new T.BoxGeometry(2.1, 3.7, .9), std(col)); body.position.y = 1.85;
      eyes(g, 3.15, .5, .32, .2); arm(g, [1.05, 2.2, 0], [1.25, .4, .5], 0xe0a040, .18);
      var wheel = new T.Mesh(new T.CylinderGeometry(.9, .9, .3, 24), std(0x222222)); wheel.rotation.z = Math.PI / 2; wheel.position.set(-2.2, .9, .3); g.add(wheel);
      var cart = new T.Mesh(new T.BoxGeometry(1.4, 1.2, 1.2), std(0xd08a2c)); cart.position.set(-1.8, 1.6, .3); g.add(cart);
    } else if (id === "price") {
      body = new T.Mesh(new T.CylinderGeometry(.12, 1.15, 4.3, 4), std(col)); body.position.y = 2.15; body.rotation.y = Math.PI / 4; body.rotation.z = -.08;
      eyes(g, 2.2, .66, .25, .19); arm(g, [.6, 1.9, .2], [1.4, 2.6, .5], col, .16);
    } else if (id === "safe") {
      body = new T.Mesh(new T.BoxGeometry(2.7, 3.4, 1.3), std(col)); body.position.y = 1.7;
      eyes(g, 2.85, .7, .33, .2); arm(g, [1.3, 2.3, 0], [2.2, .9, .5], col, .2); arm(g, [-1.3, 2.3, 0], [-2.1, 1.2, .4], col, .2);
    } else if (id === "used") {
      body = new T.Mesh(new T.BoxGeometry(1.05, 4.6, .9), std(col)); body.position.y = 2.3;
      eyes(g, 3.9, .5, .23, .19); arm(g, [.5, 3, 0], [1.2, 4.1, .4], col, .14);
      var sign = new T.Mesh(new T.BoxGeometry(.8, .6, .05), std(0xd9cfc9)); sign.position.set(1.35, 4.35, .45); sign.rotation.z = .3; g.add(sign);
    } else {
      body = new T.Mesh(new T.SphereGeometry(1, 36, 24), std(col, .9)); body.scale.set(1.55, 2.05, 1.3); body.position.y = 2.05;
      eyes(g, 2.75, 1.22, .32, .2); arm(g, [1.4, 2.4, 0], [2.3, 3.3, .3], 0x8e8c86, .17); arm(g, [-1.4, 2.4, 0], [-2.3, 3.2, .3], 0x8e8c86, .17);
      var shelf = new T.Mesh(new T.BoxGeometry(2.4, .08, .5), std(0xeeeeee)); shelf.position.set(0, 2.15, 1.32); g.add(shelf);
    }
    body.userData.dealer = id; g.add(body);
    g.traverse(function (o) { if (o.isMesh) o.userData.dealer = id; });
    g.userData.blink = 2 + Math.random() * 3;
    return g;
  }

  // 각 폰팔이의 부스: 뒷판, 진열 상품, 카운터, 차양
  function buildBooth(id, colorHex, r) {
    var g = new T.Group(), col = new T.Color(colorHex);
    var back = new T.Mesh(new T.BoxGeometry(6.4, 3.3, .25), std(0xbfc0bd)); back.position.set(0, 1.65, -1.9); g.add(back);
    var strip = new T.Mesh(new T.BoxGeometry(6.6, .32, .4), std(col.getHex(), .6)); strip.position.set(0, 3.4, -1.85); g.add(strip);
    [-3.1, 3.1].forEach(function (x) { var post = new T.Mesh(new T.BoxGeometry(.14, 4.6, .14), std(0x55595e)); post.position.set(x, 2.3, -1.7); g.add(post); });
    var bar = new T.Mesh(new T.BoxGeometry(6.3, .1, .1), std(0x55595e)); bar.position.set(0, 4.5, -1.7); g.add(bar);
    for (var h = 0; h < 7; h++) { // 위 봉에 걸린 상품
      var hang = new T.Mesh(new T.BoxGeometry(.38, .62, .05), std(PASTEL[(h * 3 + Math.floor(r() * 7)) % 7])); hang.position.set(-2.7 + h * .9, 4.05, -1.68); g.add(hang);
    }
    var counter = new T.Mesh(new T.BoxGeometry(5.6, 1.1, 1.1), std(0x9fa1a3)); counter.position.set(0, .55, 1.55); g.add(counter);
    var top = new T.Mesh(new T.BoxGeometry(5.8, .08, 1.3), std(0xe6e7e8)); top.position.set(0, 1.14, 1.55); g.add(top);
    for (var k = 0; k < 10; k++) { // 뒷판 진열 (케이스·박스)
      var item = new T.Mesh(new T.BoxGeometry(.42, .7, .06), std(PASTEL[(k + Math.floor(r() * 7)) % 7]));
      var left = k < 5; item.position.set((left ? -2.7 : 1.1) + (k % 5 % 3) * .52, 2.6 - Math.floor((k % 5) / 3) * .9, -1.74); g.add(item);
    }
    for (var j = 0; j < 4; j++) {
      var box = new T.Mesh(new T.BoxGeometry(.5, .14, .32), std([0x2b2d30, 0xffffff, col.getHex(), 0x8a8f96][j])); box.position.set(-1.6 + j * 1.05, 1.25, 1.5); g.add(box);
    }
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
    var sun = new T.DirectionalLight(0xfff4e6, .72); sun.position.set(-120, 200, 140); scene.add(sun);
    scene.add(new T.AmbientLight(0xffffff, .06));

    this.tower = buildTower(); scene.add(this.tower);
    scene.add(buildPlaza(r));
    this.crowd = buildCrowd(r, this.mobile ? 1300 : 2600); scene.add(this.crowd);

    // 탑 아래 장터: 폰팔이 여섯 + 이름 없는 노점
    this.dealers = {}; this.hitTargets = [];
    DEALERS.forEach(function (id, i) {
      var d = site.dealers[id], p = dealerPos(i);
      var holder = new T.Group(); holder.position.copy(p); holder.lookAt(0, 0, 0);
      holder.add(buildBooth(id, d.color, r));
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
      g.position.y = Math.sin(time * 1.6 + k) * .05;
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
