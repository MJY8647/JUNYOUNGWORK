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
  function copy(text) {
    var ok = function () { toast("복사했어요"); };
    var fb = function () { var ta = el("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); ok(); } catch (e) { toast("길게 눌러 복사해 주세요"); } ta.remove(); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok, fb); else fb();
  }
  function phone(p, big) { return el("div", { class: "ph" + (p.folder ? " folder" : "") + (big ? " big" : ""), style: { "--c": p.color }, "aria-hidden": "true" }); }
  function pct(p) { return p.list ? Math.round((1 - p.price / p.list) * 100) : null; }

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
    try { world = new PPWorld($("#world"), D, { onDealer: function (id) { var i = indexOf(id); if (i !== cur) go(i); else openDealer(id); }, preserve: /[?&]shot/.test(location.search) }); }
    catch (e) { console.warn(e); world = null; }
  }
  if (!world) { $("#world").hidden = true; $("#fallback").hidden = false; }
  function indexOf(id) { for (var i = 0; i < N; i++) if (CH[i].id === id) return i; return 0; }
  addEventListener("resize", function () { if (world) world.resize(); });

  /* ---------- 장면 상태 ---------- */
  var cur = -1, cardOpen = false, cardTimer = 0;
  function progress() { return Math.max(0, Math.min(N - 1, scrollY / stopH())); }
  function onScroll() {
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

  /* ---------- 폰팔이 카드 ---------- */
  var cardState = { chips: {}, zeroOnly: false, open: {}, combo: {}, grade: "S" };
  function prodCard(id, dealer, compact) {
    var p = D.products[id], off = pct(p);
    return el("button", { class: "prod", onclick: function () { openDetail(id, dealer); }, "aria-label": p.name + " " + won(p.price) + " 상세 보기" }, [
      el("div", { class: "shot" }, [phone(p)]),
      el("b", { text: p.name }),
      !compact && p.list ? el("s", { text: won(p.list) }) : null,
      el("div", { class: "pr" }, [off != null && !compact ? el("em", { text: off + "%" }) : null, p.price === 0 ? "0원" : won(p.price)]),
      !compact && p.tag ? el("div", { class: "tag", text: p.tag }) : null,
      !compact ? el("span", { class: "more", text: "상세 보기 ›" }) : null,
    ]);
  }
  function renderCard(id) {
    var d = D.dealers[id], card = $("#card");
    card.style.setProperty("--c", d.color); card.innerHTML = "";
    card.appendChild(el("span", { class: "badge", text: d.name }));
    card.appendChild(el("h2", { text: d.title }));
    var body = el("div");
    if (id === "designer") {
      body.appendChild(el("div", { class: "chips" }, d.chips.map(function (c) {
        return el("button", { class: "chip" + (cardState.chips[c] ? " on" : ""), "aria-pressed": cardState.chips[c] ? "true" : "false", text: c, onclick: function () { cardState.chips[c] = !cardState.chips[c]; renderCard(id); } });
      })));
      body.appendChild(el("div", { class: "row" }, d.products.map(function (p) { return prodCard(p, id); })));
    } else if (id === "quick" || id === "safe") {
      if (id === "safe") {
        var icons = ["▣", "▭", "✚"];
        body.appendChild(el("div", { class: "combo" }, d.combo.map(function (c, k) {
          var on = cardState.combo[c] !== false;
          return el("button", { class: on ? "on" : "", "aria-pressed": on ? "true" : "false", onclick: function () { cardState.combo[c] = !on; renderCard(id); } }, [el("span", { class: "ic", text: icons[k] }), c]);
        })));
      }
      body.appendChild(el("ol", { class: "steps-list" }, d.steps.map(function (s, k) {
        var key = id + k, open = !!cardState.open[key];
        return el("li", { class: open ? "open" : "" }, [
          el("button", { "aria-expanded": open ? "true" : "false", onclick: function () { cardState.open[key] = !open; renderCard(id); } }, [
            id === "quick" ? el("span", { class: "n", text: String(k + 1) }) : el("span", { class: "bar" }), el("span", { text: s.t }), el("span", { class: "ar", text: "›" }),
          ]),
          el("p", { text: s.d }),
        ]);
      })));
    } else if (id === "price") {
      body.appendChild(el("div", { class: "chips" }, [["전체", false], ["0원만", true]].map(function (o) {
        return el("button", { class: "chip" + (cardState.zeroOnly === o[1] ? " on" : ""), text: o[0], onclick: function () { cardState.zeroOnly = o[1]; renderCard(id); } });
      })));
      var list = d.products.slice().sort(function (a, b) { return D.products[a].price - D.products[b].price; })
        .filter(function (p) { return !cardState.zeroOnly || D.products[p].price === 0; });
      body.appendChild(el("div", { class: "row" }, list.map(function (p) { return prodCard(p, id); })));
    } else if (id === "used") {
      body.appendChild(el("div", { class: "grades" }, d.grades.map(function (g) {
        var on = cardState.grade === g.id;
        return el("button", { class: on ? "on" : "", "aria-pressed": on ? "true" : "false", onclick: function () { cardState.grade = g.id; renderCard(id); } }, [el("span", { class: "badge", text: g.name }), el("small", { text: g.d })]);
      })));
      body.appendChild(el("p", { class: "note", text: d.note }));
    } else if (id === "allinone") {
      body.appendChild(el("div", { class: "grid3" }, d.products.map(function (p) { return prodCard(p, id, true); })));
    }
    card.appendChild(body);
    card.appendChild(el("button", { class: "primary", text: d.cta, onclick: function () { dealerAction(id); } }));
    if (d.products || id === "allinone") card.appendChild(el("p", { class: "note", text: D.priceNote }));
  }
  function openDealer(id) { if (cardOpen) { var b = $("#card .primary"); if (b) b.focus(); } }
  function dealerAction(id) {
    var d = D.dealers[id];
    if (d.action === "studio") openStudio();
    else if (d.action === "pick") openPick(id);
    else openConsult(id, null);
  }

  /* ---------- 시트: 상세 / 모델 선택 / 상담 ---------- */
  var sheet = $("#sheet");
  function showSheet(node) { $("#sheetBody").innerHTML = ""; $("#sheetBody").appendChild(node); if (!sheet.open) sheet.showModal(); }
  document.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", function () { b.closest("dialog").close(); }); });
  sheet.addEventListener("click", function (e) { if (e.target === sheet) sheet.close(); });

  function openDetail(pid, dealer) {
    var p = D.products[pid], off = pct(p), d = D.dealers[dealer];
    showSheet(el("div", { class: "detail" }, [
      el("span", { class: "badge", style: { "--c": d.color }, text: d.name }),
      el("div", { class: "shot" }, [phone(p, true)]),
      el("h3", { text: p.name }),
      p.list ? el("s", { text: "출고가 " + won(p.list) }) : null,
      el("div", { class: "big" }, [off != null ? el("em", { text: off + "%" }) : null, p.price === 0 ? "0원" : won(p.price)]),
      p.tag ? el("div", { class: "tag", style: { color: "var(--blue)", "font-weight": "700" }, text: p.tag }) : null,
      el("p", { class: "note", text: D.priceNote }),
      el("div", { class: "btns" }, [
        el("button", { class: "ghost", text: "다른 모델", onclick: function () { openPick(dealer); } }),
        el("button", { class: "primary", style: { background: d.color }, text: "이 폰으로 상담", onclick: function () { openConsult(dealer, pid); } }),
      ]),
    ]));
  }
  function openPick(dealer) {
    var d = D.dealers[dealer], ids = d.products || Object.keys(D.products);
    showSheet(el("div", {}, [
      el("span", { class: "badge", style: { "--c": d.color }, text: d.name }),
      el("h3", { style: { margin: "10px 0 0", "font-size": "22px" }, text: "어떤 폰?" }),
      el("div", { class: "pick-grid" }, ids.map(function (pid) {
        var p = D.products[pid];
        return el("button", { class: "prod", style: { "flex-basis": "auto" }, onclick: function () { openConsult(dealer, pid); } }, [
          el("div", { class: "shot" }, [phone(p)]), el("b", { text: p.name }), el("div", { class: "pr", text: p.price === 0 ? "0원" : won(p.price) }),
        ]);
      })),
    ]));
  }
  function openConsult(dealer, pid, extra) {
    var d = D.dealers[dealer], rows = [["폰팔이", d.name]];
    if (pid) rows.push(["모델", D.products[pid].name], ["예시가", D.products[pid].price === 0 ? "0원" : won(D.products[pid].price)]);
    if (dealer === "quick") rows.push(["받는 방법", "퀵배송·방문 수령"]);
    if (dealer === "safe") rows.push(["보호 조합", d.combo.filter(function (c) { return cardState.combo[c] !== false; }).join(" + ") || "선택 안 함"]);
    if (dealer === "used") rows.push(["등급", d.grades.filter(function (g) { return g.id === cardState.grade; })[0].name]);
    (extra || []).forEach(function (r) { rows.push(r); });
    var text = "[폰파리 상담]\n" + rows.map(function (r) { return r[0] + ": " + r[1]; }).join("\n");
    var tel = D.contact.phone.replace(/[^0-9]/g, "");
    showSheet(el("div", {}, [
      el("span", { class: "badge", style: { "--c": d.color }, text: "상담 신청" }),
      el("div", { class: "sum-rows" }, rows.map(function (r) { return el("div", {}, [el("span", { text: r[0] }), el("b", { text: r[1] })]); })),
      el("a", { class: "tel", href: "tel:" + tel, text: D.contact.phone }),
      el("p", { class: "note center", text: D.contact.hours + " · 위 내용을 말씀해 주세요" }),
      el("div", { class: "btns" }, [
        el("button", { class: "ghost", text: "번호 복사", onclick: function () { copy(D.contact.phone); } }),
        el("button", { class: "primary", style: { background: d.color }, text: "상담 내용 복사", onclick: function () { copy(text); } }),
      ]),
      D.contact.kakao ? el("a", { class: "link", href: D.contact.kakao, target: "_blank", rel: "noopener", text: "카카오톡 채널로 문의 ›" }) : null,
    ]));
  }

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
  function openStudio() {
    if (sheet.open) sheet.close();
    $("#studio").showModal();
    if (world) world.paused = true;
    if (!studio && window.PPStudio && window.THREE) { try { studio = new PPStudio($("#studioCanvas")); } catch (e) { console.warn(e); } }
    if (studio) { studio.active = true; requestAnimationFrame(function () { studio.resize(); }); }
    renderStudio();
  }
  $("#studio").addEventListener("close", function () { if (world) world.paused = false; if (studio) studio.active = false; });
  $("#topCta").addEventListener("click", openStudio);
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
        el("button", { class: "primary", text: "이 조합으로 상담", onclick: function () {
          $("#studio").close();
          openConsult("designer", null, rows.concat([["액세서리 합계", won(total())]]));
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
