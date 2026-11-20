/* 폰꾸 작업실 — 절차적 3D 폰 + 케이스 + 키링 + 그립톡/지갑, 드래그로 360° 회전 */
(function () {
  "use strict";
  var T = window.THREE;

  function rounded(w, h, r) {
    var s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function slab(w, h, r, depth, mat, bevel) {
    var g = new T.ExtrudeGeometry(rounded(w, h, r), { depth: depth, bevelEnabled: !!bevel, bevelThickness: bevel || 0, bevelSize: bevel || 0, bevelSegments: 4, curveSegments: 12 });
    g.translate(0, 0, -depth / 2);
    return new T.Mesh(g, mat);
  }
  function mat(c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .45, metalness: .1 }, o || {})); }

  function Studio(host) {
    var self = this;
    this.host = host;
    var renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    host.appendChild(renderer.domElement); this.renderer = renderer;
    var scene = new T.Scene(); this.scene = scene;
    scene.add(new T.HemisphereLight(0xffffff, 0xb9c3cc, .9));
    var key = new T.DirectionalLight(0xffffff, .9); key.position.set(4, 6, 8); scene.add(key);
    var rim = new T.DirectionalLight(0xbfd4ff, .6); rim.position.set(-6, 2, -6); scene.add(rim);
    this.camera = new T.PerspectiveCamera(32, 1, .1, 100); this.camera.position.set(0, 0, 17);
    this.root = new T.Group(); scene.add(this.root);
    var shadow = new T.Mesh(new T.CircleGeometry(3.2, 32), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .08 }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -4.4; scene.add(shadow);
    this.rot = { x: -.12, y: -.5, vx: 0, vy: 0, tx: null, ty: null };
    this.idle = 0;
    var drag = null;
    var el = renderer.domElement;
    el.style.touchAction = "none";
    el.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); self.rot.tx = null; self.idle = 0; });
    el.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY };
      self.rot.vy = dx * .012; self.rot.vx = dy * .008; self.rot.y += self.rot.vy; self.rot.x = Math.max(-1, Math.min(1, self.rot.x + self.rot.vx));
    });
    el.addEventListener("pointerup", function () { drag = null; });
    host.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") self.rot.y -= .3; if (e.key === "ArrowRight") self.rot.y += .3;
      if (e.key === "ArrowUp") self.rot.x -= .2; if (e.key === "ArrowDown") self.rot.x += .2;
      self.idle = 0;
    });
    this.dragging = function () { return !!drag; };
    this.resize();
    this.clock = new T.Clock();
    this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
    this.active = true;
  }

  Studio.prototype.resize = function () {
    var w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return;
    this.renderer.setSize(w, h); this.camera.aspect = w / h;
    this.camera.position.z = w / h < .8 ? 21 : 17; this.camera.updateProjectionMatrix();
  };

  Studio.prototype.view = function (which) {
    var y = this.rot.y, base = Math.round(y / (2 * Math.PI)) * 2 * Math.PI;
    this.rot.tx = which === "reset" ? -.12 : 0;
    this.rot.ty = which === "back" ? base + Math.PI : which === "front" ? base : base - .5;
    this.idle = 0;
  };

  // state: { device, color, case, keyring, back } + catalog
  Studio.prototype.update = function (st, cat) {
    var root = this.root; while (root.children.length) root.remove(root.children[0]);
    var find = function (list, id) { return list.filter(function (x) { return x.id === id; })[0] || list[0]; };
    var dev = find(cat.devices, st.device), col = find(cat.colors, st.color), cs = find(cat.cases, st.case);
    var kr = find(cat.keyrings, st.keyring), bk = find(cat.backs, st.back);
    var W = 3.1 * dev.w, H = 6.4, R = .55, D = .32;
    var phone = new T.Group(); root.add(phone);
    // 본체 + 화면
    phone.add(slab(W, H, R, D, mat(col.c, { metalness: .5, roughness: .35 }), .04));
    var screen = slab(W - .18, H - .18, R - .08, .02, mat(0x0d0f14, { roughness: .15, metalness: .3 }));
    screen.position.z = D / 2 + .045; phone.add(screen);
    var island = slab(.9, .26, .13, .02, mat(0x000000)); island.position.set(0, H / 2 - .45, D / 2 + .06); phone.add(island);
    // 카메라
    var camMat = mat(0x141518, { roughness: .2, metalness: .6 }), ring = mat(col.c, { metalness: .7, roughness: .25 });
    var lens = function (x, y, r) {
      var g = new T.Group(), a = new T.Mesh(new T.CylinderGeometry(r, r, .16, 32), ring), b = new T.Mesh(new T.CylinderGeometry(r * .72, r * .72, .18, 32), camMat);
      a.rotation.x = b.rotation.x = Math.PI / 2; g.add(a, b); g.position.set(x, y, -D / 2 - .2); return g;
    };
    if (dev.cam === "vertical") {
      [0, -.75, -1.5].forEach(function (dy) { phone.add(lens(-W / 2 + .62, H / 2 - .7 + dy, .27)); });
    } else {
      var bump = slab(dev.cam === "triple" ? 1.9 : 1.15, dev.cam === "triple" ? 1.9 : 1.9, .38, .1, mat(col.c, { metalness: .4, roughness: .3 }));
      bump.position.set(-W / 2 + (dev.cam === "triple" ? 1.12 : .8), H / 2 - 1.12, -D / 2 - .14); phone.add(bump);
      var L = dev.cam === "triple" ? [[-.42, .42], [-.42, -.42], [.42, 0]] : [[0, .42], [0, -.42]];
      L.forEach(function (p) { phone.add(lens(bump.position.x + p[0], bump.position.y + p[1], .33)); });
    }
    // 케이스: 뒷판 + 테두리
    if (cs) {
      var cm = mat(cs.c, cs.clear ? { transparent: true, opacity: .32, roughness: .1 } : cs.metal ? { metalness: .9, roughness: .2 } : { roughness: .7 });
      var plate = slab(W + .16, H + .16, R + .08, .07, cm); plate.position.z = -D / 2 - .06;
      var shape = rounded(W + .2, H + .2, R + .1); shape.holes.push(rounded(W - .12, H - .12, R - .06));
      var rimG = new T.ExtrudeGeometry(shape, { depth: D + .2, bevelEnabled: false, curveSegments: 12 }); rimG.translate(0, 0, -(D + .2) / 2);
      var rimM = new T.Mesh(rimG, cm);
      // 카메라 구멍 대신 뒷판을 얇게: 렌즈가 보이도록 렌즈는 위에 그대로
      phone.add(plate, rimM);
    }
    // 뒷면 액세서리
    if (bk.id === "grip") {
      var gr = new T.Group(), base = new T.Mesh(new T.CylinderGeometry(.62, .62, .12, 40), mat(bk.c)), cap = new T.Mesh(new T.CylinderGeometry(.5, .56, .22, 40), mat(0xffffff, { roughness: .3 }));
      base.rotation.x = cap.rotation.x = Math.PI / 2; cap.position.z = -.14; gr.add(base, cap); gr.position.set(0, -.6, -D / 2 - .18); phone.add(gr);
    } else if (bk.id === "wallet") {
      var wl = slab(2.3, 1.55, .18, .22, mat(bk.c, { roughness: .8 })); wl.position.set(0, -1.1, -D / 2 - .22); phone.add(wl);
      var slot = slab(1.9, .08, .04, .03, mat(0x000000, { transparent: true, opacity: .25 })); slot.position.set(0, -.5, -D / 2 - .35); phone.add(slot);
    }
    // 키링: 왼쪽 아래 고리에 매달림
    this.charm = null;
    if (kr.id !== "none") {
      var charm = new T.Group(); charm.position.set(-W / 2 + .25, -H / 2 - .02, 0);
      var hook = new T.Mesh(new T.TorusGeometry(.16, .035, 10, 24), mat(0xc9ccd2, { metalness: .9, roughness: .2 })); charm.add(hook);
      var hang = new T.Group(); hang.position.y = -.12; charm.add(hang);
      if (kr.id === "ball") {
        var str = new T.Mesh(new T.CylinderGeometry(.02, .02, .7, 6), mat(0x333333)); str.position.y = -.35; hang.add(str);
        var ball = new T.Mesh(new T.SphereGeometry(.38, 28, 20), mat(kr.c, { roughness: .5 })); ball.position.y = -1; hang.add(ball);
      } else if (kr.id === "chain") {
        for (var i = 0; i < 7; i++) { var link = new T.Mesh(new T.TorusGeometry(.13, .04, 8, 18), mat(kr.c, { metalness: .95, roughness: .15 })); link.position.y = -.2 - i * .2; link.rotation.y = i % 2 ? Math.PI / 2 : 0; hang.add(link); }
      } else {
        var loop = new T.Mesh(new T.TorusGeometry(.42, .07, 12, 32), mat(kr.c, { roughness: .6 })); loop.scale.set(.7, 1.4, 1); loop.position.y = -.68; hang.add(loop);
      }
      phone.add(charm); this.charm = hang;
    }
  };

  Studio.prototype.loop = function () {
    requestAnimationFrame(this.loop);
    if (!this.active || document.hidden) return;
    var dt = Math.min(.05, this.clock.getDelta()), t = this.clock.elapsedTime, r = this.rot;
    this.idle += dt;
    if (r.tx != null) { r.x += (r.tx - r.x) * .1; r.y += (r.ty - r.y) * .1; if (Math.abs(r.ty - r.y) < .002) { r.tx = null; } }
    else if (!this.dragging()) {
      r.vy *= .94; r.vx *= .9; r.y += r.vy;
      if (this.idle > 3 && !matchMedia("(prefers-reduced-motion: reduce)").matches) r.y += dt * .35;
    }
    this.root.rotation.set(r.x, r.y, 0);
    this.root.position.y = Math.sin(t * 1.2) * .06;
    if (this.charm) this.charm.rotation.z = Math.sin(t * 2.4) * .18 + r.vy * 2;
    this.renderer.render(this.scene, this.camera);
  };

  Studio.prototype.snapshot = function () { this.renderer.render(this.scene, this.camera); return this.renderer.domElement.toDataURL("image/png"); };
  window.PPStudio = Studio;
})();
