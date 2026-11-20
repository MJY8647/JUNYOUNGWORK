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

  /* ---------- 스크롤 트랙 ---------- */
  var track = $("#track");
  CH.forEach(function (c, i) {
    var label = c.dealer ? D.dealers[c.id].name : c.title.replace("\n", " ");
    track.appendChild(el("section", { class: "stop", id: "s-" + c.id }, [el("h2", { class: "sr", text: label })]));
  });
  var nav = $("#chapters");
  CH.forEach(function (c, i) {
    var d = c.dealer ? D.dealers[c.id] : null;
    nav.appendChild(el("button", { style: { "--c": d ? d.color : "#202529" }, "aria-label": (d ? d.name : c.nav) + " 장면으로", onclick: function () { go(i); } },
      [el("i"), d ? d.short : c.nav]));
  });
  function stopH() { return track.firstChild.offsetHeight || innerHeight; }
  function go(i) { scrollTo({ top: i * stopH(), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }
  $("#brand").addEventListener("click", function (e) { e.preventDefault(); go(0); });
  $("#scrollHint").addEventListener("click", function () { go(1); });

  /* ---------- 3D 월드 ---------- */
  var world = null;
  if (window.THREE && window.PPWorld && PPWorld.supported()) {
    try { world = new PPWorld($("#world"), D, { onDealer: function (id) { if (document.documentElement.classList.contains("shopping")) return; var i = indexOf(id); if (i !== cur) go(i); else openDealer(id); }, preserve: /[?&]shot/.test(location.search) }); }
    catch (e) { console.warn(e); world = null; }
  }
  if (!world) { $("#world").hidden = true; $("#fallback").hidden = false; }
  function indexOf(id) { for (var i = 0; i < N; i++) if (CH[i].id === id) return i; return 0; }
  addEventListener("resize", function () { if (world) world.resize(); });

  /* ---------- 장면 상태 ---------- */
  var cur = -1, cardOpen = false, cardTimer = 0;
  function progress() { return Math.max(0, Math.min(N - 1, scrollY / stopH())); }
  function onScroll() {
    if (document.documentElement.classList.contains("shopping")) return;
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
    if (document.documentElement.classList.contains("shopping")) on = false;
    cardOpen = on; $("#card").classList.toggle("on", on);
    if (world) {
      var mobile = matchMedia("(max-width: 760px)").matches;
      world.setFrameOffset(on && !mobile ? -.17 : 0, on && mobile ? -.2 : 0);
    }
  }
  function setChapter(i) {
    cur = i; var c = CH[i];
    nav.querySelectorAll("button").forEach(function (b, k) { b.setAttribute("aria-current", k === i ? "true" : "false"); });
    var active = nav.children[i]; if (active && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = active.offsetLeft - nav.clientWidth / 2 + active.offsetWidth / 2;
    if (c.dealer) { renderCard(c.id); }
    else {
      $("#title").innerHTML = c.title.split("\n").map(function (t) { var s = el("span", { text: t }); return s.outerHTML; }).join("<br>");
      $("#sub").textContent = c.sub || "";
      $("#eyebrow").textContent = i === 0 ? "PHONEPARIS · 에펠탑 광장" : i === N - 1 ? "PHONEPARIS · 다시, 광장" : "PHONEPARIS";
    }
    $("#bubble").hidden = !c.dealer;
    if (c.dealer) { var d = D.dealers[c.id]; $("#bubbleName").textContent = d.name; $("#bubbleName").style.setProperty("--c", d.color); $("#bubbleText").textContent = "“" + d.quote + "”"; }
  }
  function tickBubble() {
    requestAnimationFrame(tickBubble);
    var c = CH[cur]; if (!c || !c.dealer || !world) return;
    var p = world.headOnScreen(c.id), b = $("#bubble");
    var mobile = matchMedia("(max-width: 760px)").matches;
    var top = Math.max(mobile ? 150 : 120, p.y);
    b.style.transform = "translate(" + Math.round(Math.min(innerWidth - 140, Math.max(140, p.x))) + "px," + Math.round(top) + "px) translate(-50%, -100%)";
    b.style.opacity = Math.abs(progress() - cur) < .15 && !(mobile && cardOpen && top > innerHeight * .4) ? 1 : 0;
  }
  requestAnimationFrame(tickBubble);
  addEventListener("scroll", onScroll, { passive: true });

  /* ---------- 폰팔이 카드: 셀링포인트 3개 + 가게 들어가기 ---------- */
  function renderCard(id) {
    var d = D.dealers[id], card = $("#card");
    card.style.setProperty("--c", d.color); card.innerHTML = "";
    card.appendChild(el("span", { class: "badge", text: d.name }));
    card.appendChild(el("h2", { text: d.title }));
    card.appendChild(el("ul", { class: "points" }, d.points.map(function (p, k) { return el("li", {}, [el("i", { text: String(k + 1) }), p]); })));
    card.appendChild(el("button", { class: "primary", text: d.short + "에게 사러 가기 →", onclick: function () { openShop(id); } }));
  }
  function openDealer(id) { openShop(id); }
  var mobileQ = matchMedia("(max-width: 760px)");
  function openShop(id) {
    var i = indexOf(id);
    if (i !== cur) scrollTo({ top: i * stopH(), behavior: "auto" });
    setCard(false); clearTimeout(cardTimer);
    PPShop.open(id);
    if (world) { world.setProgress(i); world.setFrameOffset(mobileQ.matches ? 0 : -.2, mobileQ.matches ? -.17 : 0); }
  }
  PPShop.init({
    toast: toast,
    onTalk: function (on) { if (world) world.talk(on ? PPShop.state().dealer : null); },
    onClose: function () { if (world) world.talk(null); cardOpen = false; onScroll(); },
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

  /* ---------- 시작 ---------- */
  function ready() { document.body.classList.add("ready"); }
  if (world) { var w0 = Date.now(); (function wait() { if (world.frames > 2 || Date.now() - w0 > 6000) ready(); else requestAnimationFrame(wait); })(); }
  else { var im = $("#fallbackImg"); im.onload = ready; setTimeout(ready, 2500); }
  onScroll();
  window.PP = { world: function () { return world; }, go: go, state: function () { return { cur: cur, cardOpen: cardOpen, studio: sState, step: sStep }; } };
})();
