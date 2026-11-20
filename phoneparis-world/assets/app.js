/* 폰파리 — 스크롤 ↔ 3D 카메라 연결, 폰팔이 카드, 클릭 흐름, 폰꾸 작업실 */
(function () {
  "use strict";
  var D = window.SITE, $ = function (s) { return document.querySelector(s); };
  var won = function (n) { return n.toLocaleString("ko-KR") + "원"; };
  var CH = D.chapters, N = CH.length;
  var FALLBACK = ["000", "030", "044", "060", "096", "136", "176", "216", "256", "304"];

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      var v = attrs[k];
      if (k === "text") e.textContent = v; else if (k === "html") e.innerHTML = v;
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
      else if (k === "style" && typeof v === "object") for (var p in v) e.style.setProperty(p, v[p]);
      else if (v != null && v !== false) e.setAttribute(k, v === true ? "" : v);
    }
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  var toastT;
  function toast(m) { var t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); }, 1800); }

  /* ---------- 스크롤 트랙 + 장면 도크 ---------- */
  var track = $("#track");
  CH.forEach(function (c, i) {
    var label = c.dealer ? D.dealers[c.id].name : c.title.replace("\n", " ");
    track.appendChild(el("section", { class: "stop", id: "s-" + c.id }, [el("h2", { class: "sr", text: label })]));
  });
  var nav = $("#chapters"), navInd = el("span", { class: "ind", "aria-hidden": "true" });
  nav.appendChild(navInd);
  CH.forEach(function (c, i) {
    var d = c.dealer ? D.dealers[c.id] : null;
    nav.appendChild(el("button", { style: { "--c": d ? d.color : "#202529" }, "aria-label": (d ? d.name : c.nav) + " 장면으로", onclick: function () { go(i); } },
      [el("i"), el("span", { text: d ? d.short : c.nav })]));
  });
  function moveInd() { // 현재 장면 버튼 아래로 미끄러지는 표시
    var b = nav.querySelectorAll("button")[cur]; if (!b) return;
    navInd.style.width = b.offsetWidth + "px"; navInd.style.transform = "translateX(" + b.offsetLeft + "px)";
    navInd.style.setProperty("--c", b.style.getPropertyValue("--c"));
  }
  function stopH() { return track.firstChild.offsetHeight || innerHeight; }
  function go(i) { scrollTo({ top: i * stopH(), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }
  $("#brand").addEventListener("click", function (e) { e.preventDefault(); go(0); });
  $("#scrollHint").addEventListener("click", function () { go(1); });
  var shopping = function () { return document.documentElement.classList.contains("shopping"); };

  /* ---------- 3D 월드 ---------- */
  var world = null;
  if (window.THREE && window.PPWorld && PPWorld.supported()) {
    try {
      world = new PPWorld($("#world"), D, {
        onDealer: function (id) { if (shopping()) return; var i = indexOf(id); if (i !== cur) go(i); else openDealer(id); },
        onHover: function (id) { onDealerHover(id); },
        preserve: /[?&]shot/.test(location.search),
      });
    } catch (e) { console.warn(e); world = null; }
  }
  if (!world) { $("#world").hidden = true; $("#fallback").hidden = false; }
  function indexOf(id) { for (var i = 0; i < N; i++) if (CH[i].id === id) return i; return 0; }
  addEventListener("resize", function () { if (world) world.resize(); moveInd(); });

  /* ---------- 장면 상태 ---------- */
  var cur = -1, cardOpen = false, cardTimer = 0;
  function progress() { return Math.max(0, Math.min(N - 1, scrollY / stopH())); }
  function onScroll() {
    if (shopping()) return;
    var s = progress(), i = Math.round(s), near = Math.abs(s - i);
    if (world) world.setProgress(s);
    else { var img = $("#fallbackImg"), src = "assets/fallback/" + FALLBACK[i] + ".webp"; if (img.getAttribute("src") !== src) img.src = src; }
    $("#progress").style.width = (s / (N - 1) * 100) + "%";
    $("#scrollHint").classList.toggle("off", s > .3 || cardOpen);
    var c = CH[i];
    $("#headline").classList.toggle("off", !!c.dealer || near > .22);
    if (i !== cur) setChapter(i);
    var showCard = !!c.dealer && near < .12;
    if (showCard !== cardOpen) {
      clearTimeout(cardTimer);
      if (showCard) cardTimer = setTimeout(function () { setCard(true); }, 380); else setCard(false);
    }
  }
  function setCard(on) {
    if (shopping()) on = false;
    cardOpen = on; $("#card").classList.toggle("on", on);
    if (world) {
      var mobile = matchMedia("(max-width: 760px)").matches;
      world.setFrameOffset(on && !mobile ? -.17 : 0, on && mobile ? -.2 : 0);
    }
  }
  function setChapter(i) {
    cur = i; var c = CH[i];
    nav.querySelectorAll("button").forEach(function (b, k) { b.setAttribute("aria-current", k === i ? "true" : "false"); });
    var active = nav.querySelectorAll("button")[i]; if (active && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = active.offsetLeft - nav.clientWidth / 2 + active.offsetWidth / 2;
    moveInd();
    if (c.dealer) { renderCard(c.id); }
    else {
      $("#title").innerHTML = c.title.split("\n").map(function (t) { var s = el("span", { text: t }); return s.outerHTML; }).join("<br>");
      $("#sub").textContent = c.sub || "";
      $("#eyebrow").textContent = i === 0 ? "PHONEPARIS · 에펠탑 광장" : i === N - 1 ? "PHONEPARIS · 다시, 광장" : "PHONEPARIS";
    }
    $("#bubble").hidden = !c.dealer;
    clearInterval(toutTimer);
    if (c.dealer) {
      var d = D.dealers[c.id], b = $("#bubble");
      b.dataset.d = c.id; b.style.setProperty("--c", d.color); b.style.setProperty("--dk", d.ink || "#202529");
      $("#bubbleName").innerHTML = PPShop.ava(c.id, "xs") + "<span>" + d.name + "</span>";
      startTout(c.id);
    }
  }

  /* ---------- 호객 말풍선: 폰팔이마다 다른 멘트를 돌려 가며 + 동작에 맞춰 이모트 ---------- */
  var toutTimer = 0, toutIdx = 0, holdUntil = 0, emoteOn = false;
  function sayBubble(text, hold) {
    var b = $("#bubble"); $("#bubbleText").textContent = text;
    b.classList.remove("swap"); void b.offsetWidth; b.classList.add("swap");
    if (hold) holdUntil = Date.now() + 2800;
  }
  function startTout(id) {
    var d = D.dealers[id], L = ["“" + d.quote + "”"].concat(d.tout || []);
    toutIdx = 0; holdUntil = 0; sayBubble(L[0]);
    toutTimer = setInterval(function () {
      if (Date.now() < holdUntil || document.hidden || shopping()) return;
      toutIdx = (toutIdx + 1) % L.length; sayBubble(L[toutIdx]);
    }, 4200);
  }
  function popEmote(t) { var e = $("#emote"); e.textContent = t; e.classList.remove("pop"); void e.offsetWidth; e.classList.add("pop"); }
  function tickBubble() {
    requestAnimationFrame(tickBubble);
    var c = CH[cur]; if (!c || !c.dealer || !world) return;
    var p = world.headOnScreen(c.id), b = $("#bubble");
    var mobile = matchMedia("(max-width: 760px)").matches;
    var top = Math.max(mobile ? 150 : 120, p.y);
    b.style.transform = "translate(" + Math.round(Math.min(innerWidth - 150, Math.max(150, p.x))) + "px," + Math.round(top) + "px) translate(-50%, -100%)";
    b.style.opacity = Math.abs(progress() - cur) < .15 && !(mobile && cardOpen && top > innerHeight * .4) ? 1 : 0;
    var env = world.toutEnv(c.id);
    if (env > .5 && !emoteOn) { emoteOn = true; popEmote(D.dealers[c.id].emote || "!"); }
    if (env < .15) emoteOn = false;
  }
  requestAnimationFrame(tickBubble);
  addEventListener("scroll", onScroll, { passive: true });

  /* ---------- 캐릭터에 마우스를 올리면: 반응 멘트 + 커서 라벨 ---------- */
  function onDealerHover(id) {
    cursorDealer(id);
    var c = CH[cur];
    if (id && c && c.id === id && !shopping()) sayBubble(D.dealers[id].hover, true);
  }

  /* ---------- 폰팔이 카드: 아바타 + 셀링포인트 3개 + 가게 들어가기 ---------- */
  function renderCard(id) {
    var d = D.dealers[id], card = $("#card");
    card.style.setProperty("--c", d.color); card.style.setProperty("--dk", d.ink || "#202529"); card.dataset.d = id; card.innerHTML = "";
    var head = el("div", { class: "card-h" });
    head.innerHTML = PPShop.ava(id);
    head.appendChild(el("div", { class: "who" }, [el("span", { class: "badge", text: d.name }), el("small", { class: "role", text: d.role || "" })]));
    head.appendChild(el("span", { class: "live" }, [el("i"), "호객 중"]));
    card.appendChild(head);
    card.appendChild(el("h2", { text: d.title }));
    card.appendChild(el("ul", { class: "points" }, d.points.map(function (p, k) { return el("li", { style: { "--k": k } }, [el("i", { text: String(k + 1) }), el("span", { text: p })]); })));
    var cta = el("button", { class: "primary magnet", onclick: function () { openShop(id); } }, [el("span", { text: d.short + "에게 사러 가기" }), el("i", { class: "arr", "aria-hidden": "true", text: "→" })]);
    card.appendChild(cta);
  }
  function openDealer(id) { openShop(id); }
  var mobileQ = matchMedia("(max-width: 760px)");
  function openShop(id) {
    var i = indexOf(id); cursorDealer(null);
    if (i !== cur) scrollTo({ top: i * stopH(), behavior: "auto" });
    setCard(false); clearTimeout(cardTimer);
    PPShop.open(id);
    if (world) { world.setProgress(i); world.setFrameOffset(mobileQ.matches ? 0 : -.2, mobileQ.matches ? -.17 : 0); world.halfRate = true; }
  }
  PPShop.init({
    toast: toast,
    onTalk: function (on) { if (world) world.talk(on ? PPShop.state().dealer : null); },
    onClose: function () { if (world) { world.talk(null); world.halfRate = false; } cursorDealer(null); cardOpen = false; onScroll(); },
    openStudio: function (G) { openStudio(G); },
  });

  /* ---------- 시트 (이미지 보기) ---------- */
  var sheet = $("#sheet");
  function showSheet(node) { $("#sheetBody").innerHTML = ""; $("#sheetBody").appendChild(node); if (!sheet.open) sheet.showModal(); }
  document.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", function () { b.closest("dialog").close(); }); });
  sheet.addEventListener("click", function (e) { if (e.target === sheet) sheet.close(); });

  /* ---------- 폰꾸 작업실 ---------- */
  var S = D.studio, studio = null, sStep = 0, sMax = 0;
  var sState = { device: "ip17", color: "silver", case: "clear", keyring: "none", back: "none" };
  try { var saved = JSON.parse(localStorage.getItem("pp-studio") || "null"); if (saved) Object.assign(sState, saved); } catch (e) {}
  var STEPS = [
    { key: "device", label: "기기", title: "어떤 폰과 함께해?", list: S.devices },
    { key: "case", label: "케이스", title: "취향을 입혀 봐.", list: S.cases },
    { key: "keyring", label: "키링", title: "작은 디테일, 큰 차이.", list: S.keyrings },
    { key: "back", label: "뒷면", title: "마지막 한 끗.", list: S.backs },
    { key: "done", label: "완성", title: "이 조합, 완전 너답다." },
  ];
  function find(list, id) { return list.filter(function (x) { return x.id === id; })[0] || list[0]; }
  function total() { return find(S.cases, sState.case).price + find(S.keyrings, sState.keyring).price + find(S.backs, sState.back).price; }
  var fromShop = null;
  function devFor(md) { var n = md ? md.name : ""; return /Galaxy|폴더/.test(n) ? "s26" : /Pro|Duo/.test(n) ? "ip18p" : "ip17"; }
  function openStudio(G) {
    if (sheet.open) sheet.close();
    fromShop = G && G.deco ? G : null;
    if (fromShop) { sState.device = devFor(G.md); sState.case = G.deco.case; sState.keyring = G.deco.keyring; sState.back = G.deco.back; sStep = 1; sMax = 4; }
    else sStep = 0; // 위 「내 폰 꾸미기」로 열면 늘 기기부터 (가게에서 열었던 단계가 남지 않게)
    $("#studio").showModal();
    if (world) world.paused = true;
    if (!studio && window.PPStudio && window.THREE) { try { studio = new PPStudio($("#studioCanvas")); } catch (e) { console.warn(e); } }
    if (studio) { studio.active = true; requestAnimationFrame(function () { studio.resize(); }); }
    renderStudio();
  }
  $("#studio").addEventListener("close", function () {
    if (world) world.paused = false; if (studio) studio.active = false;
    if (fromShop) { PPShop.setDeco({ case: sState.case, keyring: sState.keyring, back: sState.back }); fromShop = null; }
  });
  $("#topCta").addEventListener("click", function () { openStudio(null); });
  document.querySelectorAll("[data-view]").forEach(function (b) { b.addEventListener("click", function () { if (studio) studio.view(b.dataset.view); }); });
  function renderStudio() {
    sMax = Math.max(sMax, sStep);
    try { localStorage.setItem("pp-studio", JSON.stringify(sState)); } catch (e) {}
    if (studio) studio.update(sState, S);
    var steps = $("#studioSteps"); steps.innerHTML = "";
    STEPS.forEach(function (s, i) {
      steps.appendChild(el("button", { "aria-current": i === sStep ? "step" : "false", disabled: i > sMax, onclick: function () { sStep = i; renderStudio(); }, text: (i < sStep ? "✓ " : "") + s.label }));
    });
    var st = STEPS[sStep], body = $("#studioBody"); body.innerHTML = "";
    body.appendChild(el("h3", { text: st.title }));
    if (st.list) {
      body.appendChild(el("div", { class: "opts" }, st.list.map(function (o) {
        var on = sState[st.key] === o.id;
        return el("button", { class: "opt" + (on ? " on" : ""), "aria-pressed": on ? "true" : "false", onclick: function () { sState[st.key] = o.id; renderStudio(); } }, [
          o.c ? el("span", { class: "sw", style: { "--c": o.c } }) : null,
          el("b", { text: o.name }),
          sStep > 0 ? el("small", { text: o.price ? won(o.price) : "추가 없음" }) : null,
        ]);
      })));
      if (st.key === "device") body.appendChild(el("div", { class: "swatches" }, S.colors.map(function (c) {
        return el("button", { class: sState.color === c.id ? "on" : "", style: { "--c": c.c }, "aria-label": c.name, "aria-pressed": sState.color === c.id ? "true" : "false", onclick: function () { sState.color = c.id; renderStudio(); } });
      }).concat([el("span", { class: "note", text: find(S.colors, sState.color).name })])));
    } else {
      var rows = [["기기", find(S.devices, sState.device).name + " · " + find(S.colors, sState.color).name], ["케이스", find(S.cases, sState.case).name], ["키링", find(S.keyrings, sState.keyring).name], ["뒷면", find(S.backs, sState.back).name]];
      body.appendChild(el("div", { class: "sum-rows" }, rows.map(function (r) { return el("div", {}, [el("span", { text: r[0] }), el("b", { text: r[1] })]); })));
      body.appendChild(el("div", { class: "btns" }, [
        el("button", { class: "ghost", text: "이미지 보기", onclick: function () {
          if (!studio) return toast("3D 미리보기를 쓸 수 없는 브라우저예요");
          showSheet(el("div", { class: "center" }, [el("h3", { style: { margin: "0 0 10px" }, text: "길게 눌러 저장" }), el("img", { class: "shot-img", src: studio.snapshot(), alt: "내가 꾸민 폰" })]));
        } }),
        el("button", { class: "primary", text: fromShop ? "이 조합으로 계속" : "디자이너에게 사러 가기", onclick: function () {
          var had = !!fromShop; $("#studio").close();
          if (!had) { openShop("designer"); }
        } }),
      ]));
    }
    $("#studioTotal").textContent = won(total());
    $("#studioPrev").disabled = sStep === 0;
    $("#studioNext").textContent = sStep === STEPS.length - 2 ? "완성 보기" : sStep === STEPS.length - 1 ? "처음부터" : "다음";
  }
  $("#studioPrev").addEventListener("click", function () { if (sStep > 0) { sStep--; renderStudio(); } });
  $("#studioNext").addEventListener("click", function () { sStep = sStep === STEPS.length - 1 ? 0 : sStep + 1; renderStudio(); });

  /* ---------- 인터랙션: 커서·눈·기울기·자석·물결·스포트라이트 ---------- */
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches, still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement, cursor = $("#cursor");
  // 아바타 눈동자: 화면 어디에 마우스가 있든 그쪽을 봄
  var eyeRaf = 0, ex = 0, ey = 0;
  addEventListener("pointermove", function (e) {
    ex = e.clientX / innerWidth * 2 - 1; ey = e.clientY / innerHeight * 2 - 1;
    if (!eyeRaf) eyeRaf = requestAnimationFrame(function () { eyeRaf = 0; root.style.setProperty("--ex", ex.toFixed(3)); root.style.setProperty("--ey", ey.toFixed(3)); });
  }, { passive: true });
  // 커서 따라다니는 링 (+ 캐릭터 위에서는 이름표)
  if (fine && !still && cursor) {
    root.classList.add("has-cursor");
    var cx = -100, cy = -100, tx = -100, ty = -100;
    addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; cursor.classList.add("on"); }, { passive: true });
    document.addEventListener("pointerleave", function () { cursor.classList.remove("on"); });
    document.addEventListener("pointerover", function (e) {
      var t = e.target;
      cursor.classList.toggle("link", !!(t.closest && t.closest("button, a, input, label, [role=button], .pk, canvas")) && !(t.id === "world" && !cursor.classList.contains("dealer")));
      cursor.classList.toggle("text", !!(t.closest && t.closest("input")));
    });
    (function follow() { cx += (tx - cx) * .2; cy += (ty - cy) * .2; cursor.style.transform = "translate(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px)"; requestAnimationFrame(follow); })();
  }
  function cursorDealer(id) {
    if (!cursor) return;
    cursor.classList.toggle("dealer", !!id);
    if (id) {
      var d = D.dealers[id], here = CH[cur] && CH[cur].id === id;
      cursor.style.setProperty("--c", d.color);
      $("#cursorLabel").textContent = here ? d.short + "에게 사러 가기" : d.short + " 보러 가기";
    }
  }
  if (fine && !still) {
    // 카드 3D 기울기 + 스포트라이트
    var card = $("#card");
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      card.style.setProperty("--rx", ((.5 - y) * 5).toFixed(2) + "deg"); card.style.setProperty("--ry", ((x - .5) * 6).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", function () { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
    // 자석 버튼: 마우스 쪽으로 살짝 끌려옴
    var lastMag = null;
    document.addEventListener("pointermove", function (e) {
      var m = e.target.closest && e.target.closest(".magnet, .say.go");
      if (lastMag && lastMag !== m) { lastMag.style.removeProperty("--tx"); lastMag.style.removeProperty("--ty"); }
      lastMag = m; if (!m) return;
      var r = m.getBoundingClientRect();
      m.style.setProperty("--tx", ((e.clientX - r.left - r.width / 2) * .16).toFixed(1) + "px");
      m.style.setProperty("--ty", ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + "px");
    }, { passive: true });
    // 가게 테이블: 상품 카드 스포트라이트, 할인 카드 기울기
    $("#shopPanel").addEventListener("pointermove", function (e) {
      var t = e.target.closest && e.target.closest(".pk, .dcard, .tok, .veh button, .way"); if (!t) return;
      var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      t.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); t.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      if (t.classList.contains("dcard")) { t.style.setProperty("--rx", ((.5 - y) * 10).toFixed(1) + "deg"); t.style.setProperty("--ry", ((x - .5) * 12).toFixed(1) + "deg"); }
    });
    $("#shopPanel").addEventListener("pointerout", function (e) {
      var t = e.target.closest && e.target.closest(".dcard"); if (t && !t.contains(e.relatedTarget)) { t.style.setProperty("--rx", "0deg"); t.style.setProperty("--ry", "0deg"); }
    });
  }
  // 누르면 물결
  if (!still) document.addEventListener("pointerdown", function (e) {
    var b = e.target.closest && e.target.closest(".say, .primary, .ghost, .tok, .veh button, .brands button, .social button, .foldseg button, .sbtn, .top-cta, .chapters button, .ctabs button");
    if (!b) return;
    var r = b.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2, s = el("span", { class: "rip", "aria-hidden": "true" });
    s.style.cssText = "width:" + size + "px;height:" + size + "px;left:" + (e.clientX - r.left - size / 2) + "px;top:" + (e.clientY - r.top - size / 2) + "px";
    b.appendChild(s); setTimeout(function () { s.remove(); }, 650);
  });

  /* ---------- 파리 실사 사진: 지금 시각(보는 사람 기기 기준)에 맞춰 낮 06–18시 / 밤 ---------- */
  var PARIS = { day: ["assets/img/paris/day-1.webp", "assets/img/paris/day-2.webp"], night: ["assets/img/paris/night-1.webp", "assets/img/paris/night-2.webp"] };
  function parisPhoto(now) { var h = (now || new Date()).getHours(), set = h >= 6 && h < 19 ? "day" : "night"; return { time: set, src: PARIS[set][Math.floor(Math.random() * 2)] }; }
  function applyParis() { var p = parisPhoto(), l = $("#loader"); if (l && l.dataset.time !== p.time) { l.dataset.time = p.time; l.style.setProperty("--photo", 'url("' + new URL(p.src, location.href).href + '")'); /* 절대 주소: var() 안 url은 CSS 파일 기준으로 풀림 */ } }
  applyParis(); setInterval(applyParis, 60000); // 1분마다 낮·밤이 바뀌었는지 확인

  /* ---------- 시작 ---------- */
  function ready() { document.body.classList.add("ready"); }
  if (world) { var w0 = Date.now(); (function wait() { if (world.frames > 2 || Date.now() - w0 > 6000) ready(); else requestAnimationFrame(wait); })(); }
  else { var im = $("#fallbackImg"); im.onload = ready; setTimeout(ready, 2500); }
  onScroll();
  window.PP = { world: function () { return world; }, go: go, parisPhoto: parisPhoto, state: function () { return { cur: cur, cardOpen: cardOpen, studio: sState, step: sStep }; } };
})();
