/* 폰파리 딜러 스튜디오 — SITE(content.js) 데이터로 화면을 그리고, 기능마다 함수 하나. */
(function () {
  "use strict";
  var D = window.SITE;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var won = function (n) { return Math.round(n).toLocaleString("ko-KR"); };
  var man = function (n) { // 1,690,000 -> 169만
    n = Math.round(n / 1000) * 1000;
    if (Math.abs(n) >= 10000) { var m = n / 10000; return (Number.isInteger(m) ? m : m.toFixed(1)) + "만"; }
    return won(n);
  };
  var byId = function (list, id) { return list.filter(function (x) { return x.id === id; })[0]; };

  /* ---------- 상태 ---------- */
  var DEFAULT = {
    brand: "Apple", model: null, storage: null, carrier: null, join: null,
    plan: null, planAfter: null, method: "auto", sub: null, extra: 0,
    months: 24, trade: 0, bundle: "none", card: 0, addons: [], checks: [], step: 0,
    board: { carrier: "skt", join: "mnp", plan: "p109", method: "sub", extra: 200000, models: ["ip18p", "ip17", "s26u", "zf8", "zfl8"], theme: 0 },
    careDate: null,
  };
  var S = load();
  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem("pp-state") || "null");
      if (raw) return Object.assign({}, JSON.parse(JSON.stringify(DEFAULT)), raw);
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  function save() { try { localStorage.setItem("pp-state", JSON.stringify(S)); } catch (e) {} }

  /* ---------- 계산 ---------- */
  function defaultSubsidy(modelId, carrierId, planId, joinId) {
    var m = byId(D.models, modelId), c = byId(D.carriers, carrierId), p = byId(D.plans, planId), j = byId(D.joinTypes, joinId);
    if (!m || !c || !p || !j) return 0;
    return Math.round(D.subsidyBase * m.tier * p.factor * c.factor * j.factor / 1000) * 1000;
  }
  function addonCost(ids) {
    return ids.reduce(function (a, id) { var x = byId(D.addons, id); return a + (x ? x.fee * x.keep : 0); }, 0);
  }
  // 하나의 방식(sub=공시지원금, con=선택약정)으로 계산
  function calc(o, method) {
    var m = byId(D.models, o.model);
    var P = m && o.storage ? m.prices[o.storage] : 0;
    var hi = byId(D.plans, o.plan), lo = byId(D.plans, o.planAfter || o.plan) || hi;
    var sub = method === "sub" ? (o.sub != null ? o.sub : defaultSubsidy(o.model, o.carrier, o.plan, o.join)) : 0;
    var principal = Math.max(0, P - sub - o.extra - o.trade);
    var n = o.months, r = D.installmentRate / 12;
    var devMonthly = n ? principal * r / (1 - Math.pow(1 + r, -n)) : 0;
    var interest = n ? devMonthly * n - principal : 0;
    var H = n || 24, k = Math.min(6, H);
    var rate = method === "con" ? 1 - D.contractDiscount : 1;
    var off = (byId(D.bundles, o.bundle) || { monthly: 0 }).monthly + o.card;
    var planHi = hi ? Math.max(0, hi.price * rate - off) : 0;
    var planLo = lo ? Math.max(0, lo.price * rate - off) : 0;
    var add = addonCost(o.addons);
    var addMonthly = o.addons.reduce(function (a, id) { var x = byId(D.addons, id); return a + (x ? x.fee : 0); }, 0);
    var total = principal + interest + planHi * k + planLo * (H - k) + add;
    return {
      method: method, price: P, sub: sub, principal: principal, interest: interest,
      devMonthly: devMonthly, first: devMonthly + planHi + addMonthly, after: devMonthly + planLo,
      total: total, months: H, cash: n ? 0 : principal,
    };
  }
  function quote(o) {
    var a = calc(o, "sub"), b = calc(o, "con");
    var best = a.total <= b.total ? a : b;
    var pick = o.method === "auto" ? best : (o.method === "sub" ? a : b);
    return { sub: a, con: b, best: best.method, pick: pick };
  }

  /* ---------- 공용 UI ---------- */
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function tile(opts) { // 큰 탭 타일: 제목 + 보조 숫자
    return el("button", {
      class: "tile" + (opts.on ? " on" : "") + (opts.cls ? " " + opts.cls : ""),
      "aria-pressed": opts.on ? "true" : "false", onclick: opts.onclick,
      style: opts.color ? "--dot:" + opts.color : null,
    }, [
      opts.icon ? el("span", { class: "ic", text: opts.icon }) : null,
      el("b", { text: opts.title }),
      opts.sub ? el("small", { text: opts.sub }) : null,
      opts.badge ? el("em", { class: "badge", text: opts.badge }) : null,
    ]);
  }
  function chip(label, on, onclick) {
    return el("button", { class: "chip" + (on ? " on" : ""), "aria-pressed": on ? "true" : "false", onclick: onclick, text: label });
  }
  function group(label, kids, cls) {
    return el("div", { class: "group" + (cls ? " " + cls : "") }, [el("h3", { text: label }), el("div", { class: "chips" }, kids)]);
  }
  function stepper(label, value, step, onchange) {
    return el("div", { class: "stepper" }, [
      el("span", { text: label }),
      el("button", { class: "chip", "aria-label": label + " 감소", onclick: function () { onchange(Math.max(0, value - step)); }, text: "−" }),
      el("b", { text: man(value) }),
      el("button", { class: "chip", "aria-label": label + " 증가", onclick: function () { onchange(value + step); }, text: "+" }),
    ]);
  }
  var toastT;
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); }, 1600);
  }
  function copy(text) {
    var done = function () { toast("복사했어요"); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
    function fallback() {
      var ta = el("textarea", {}); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { toast("복사 실패"); }
      ta.remove();
    }
  }

  /* ---------- 견적 마법사 ---------- */
  var STEPS = [
    { key: "model", label: "기종", ready: function () { return !!S.model; } },
    { key: "storage", label: "용량", ready: function () { return !!S.storage; } },
    { key: "open", label: "개통", ready: function () { return S.carrier && S.join; } },
    { key: "plan", label: "요금", ready: function () { return !!S.plan; } },
    { key: "after", label: "변경", ready: function () { return !!S.planAfter; } },
    { key: "support", label: "지원", ready: function () { return true; } },
    { key: "pay", label: "결제", ready: function () { return true; } },
    { key: "perk", label: "혜택", ready: function () { return true; } },
    { key: "result", label: "견적", ready: function () { return true; } },
    { key: "check", label: "체크", ready: function () { return true; } },
  ];
  function canEnter(i) { for (var k = 0; k < i; k++) if (!STEPS[k].ready()) return false; return true; }
  function go(i) {
    if (i < 0 || i >= STEPS.length || !canEnter(i)) return;
    S.step = i; save(); renderQuote();
    var st = $("#stage"); st.classList.remove("enter"); void st.offsetWidth; st.classList.add("enter");
  }
  function set(patch, advance) {
    Object.assign(S, patch); save();
    if (advance && STEPS[S.step].ready()) go(S.step + 1); else renderQuote();
  }

  function renderSteps() {
    var ol = $("#steps"); ol.innerHTML = "";
    STEPS.forEach(function (s, i) {
      ol.appendChild(el("li", {}, [el("button", {
        class: (i === S.step ? "cur " : "") + (i < S.step ? "done" : ""),
        disabled: !canEnter(i), "aria-current": i === S.step ? "step" : null,
        onclick: function () { go(i); }, text: s.label,
      })]));
    });
    var cur = ol.querySelector(".cur");
    if (cur && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = cur.offsetLeft - (ol.clientWidth - cur.offsetWidth) / 2;
  }

  var VIEWS = {
    model: function () {
      var brands = ["Apple", "Samsung"];
      var wrap = el("div", {}, [el("div", { class: "seg" }, brands.map(function (b) {
        return chip(b === "Apple" ? "아이폰" : "갤럭시", S.brand === b, function () { set({ brand: b }); });
      }))]);
      var grid = el("div", { class: "grid" });
      D.models.filter(function (m) { return m.brand === S.brand; }).forEach(function (m) {
        var from = Math.min.apply(null, Object.keys(m.prices).map(function (k) { return m.prices[k]; }));
        grid.appendChild(tile({
          title: m.short, sub: man(from) + "~", on: S.model === m.id,
          onclick: function () {
            var caps = Object.keys(m.prices);
            set({ model: m.id, storage: caps.length === 1 ? caps[0] : (S.model === m.id ? S.storage : null), sub: null }, true);
          },
        }));
      });
      wrap.appendChild(grid);
      return wrap;
    },
    storage: function () {
      var m = byId(D.models, S.model), grid = el("div", { class: "grid" });
      Object.keys(m.prices).forEach(function (k) {
        grid.appendChild(tile({ title: k, sub: won(m.prices[k]), on: S.storage === k, onclick: function () { set({ storage: k }, true); } }));
      });
      return grid;
    },
    open: function () {
      return el("div", {}, [
        el("div", { class: "grid g3" }, D.carriers.map(function (c) {
          return tile({ title: c.name, color: c.color, cls: "dot", on: S.carrier === c.id, onclick: function () { set({ carrier: c.id, sub: null }, !!S.join); } });
        })),
        el("div", { class: "grid g3" }, D.joinTypes.map(function (j) {
          return tile({ title: j.name, icon: j.icon, on: S.join === j.id, onclick: function () { set({ join: j.id, sub: null }, !!S.carrier); } });
        })),
      ]);
    },
    plan: function () {
      return el("div", { class: "grid" }, D.plans.map(function (p) {
        return tile({
          title: man(p.price), sub: p.data + " · 지원 " + man(defaultSubsidy(S.model, S.carrier, p.id, S.join)),
          on: S.plan === p.id, onclick: function () {
            var keep = byId(D.plans, S.planAfter);
            set({ plan: p.id, planAfter: keep && keep.price <= p.price ? keep.id : null, sub: null }, true);
          },
        });
      }));
    },
    after: function () {
      var cur = byId(D.plans, S.plan);
      var list = D.plans.filter(function (p) { return p.price <= cur.price; });
      return el("div", {}, [
        el("p", { class: "hint", text: D.highPlanDays + "일 뒤 바꿀 요금제" }),
        el("div", { class: "grid" }, list.map(function (p) {
          return tile({ title: p.id === S.plan ? "유지" : man(p.price), sub: p.data, on: S.planAfter === p.id, onclick: function () { set({ planAfter: p.id }, true); } });
        })),
      ]);
    },
    support: function () {
      var q = quote(S);
      var subVal = S.sub != null ? S.sub : defaultSubsidy(S.model, S.carrier, S.plan, S.join);
      return el("div", {}, [
        el("div", { class: "grid g2" }, [
          tile({ title: "공시지원금", sub: "−" + man(subVal), badge: q.best === "sub" ? "유리" : null, on: q.pick.method === "sub", onclick: function () { set({ method: "sub" }); } }),
          tile({ title: "선택약정 25%", sub: "월 −" + man(byId(D.plans, S.plan).price * D.contractDiscount), badge: q.best === "con" ? "유리" : null, on: q.pick.method === "con", onclick: function () { set({ method: "con" }); } }),
        ]),
        el("div", { class: "chips center" }, [chip("자동(유리한 쪽)", S.method === "auto", function () { set({ method: "auto" }); })]),
        stepper("공시지원금", subVal, 10000, function (v) { set({ sub: v }); }),
        group("추가지원금", D.extraSupport.map(function (v) { return chip(v ? man(v) : "0", S.extra === v, function () { set({ extra: v }); }); })),
        stepper("직접 입력", S.extra, 10000, function (v) { set({ extra: v }); }),
      ]);
    },
    pay: function () {
      return el("div", {}, [
        group("할부", D.months.map(function (n) { return chip(n ? n + "개월" : "현금완납", S.months === n, function () { set({ months: n }); }); })),
        group("중고폰 반납", D.tradeIn.map(function (v) { return chip(v ? man(v) : "없음", S.trade === v, function () { set({ trade: v }); }); })),
        stepper("반납 직접", S.trade, 10000, function (v) { set({ trade: v }); }),
      ]);
    },
    perk: function () {
      return el("div", {}, [
        el("div", { class: "grid g5" }, D.addons.map(function (a) {
          var on = S.addons.indexOf(a.id) > -1;
          return tile({ title: a.name, icon: a.icon, sub: man(a.fee) + "·" + a.keep + "달", on: on, onclick: function () {
            set({ addons: on ? S.addons.filter(function (x) { return x !== a.id; }) : S.addons.concat(a.id) });
          } });
        })),
        group("결합", D.bundles.map(function (b) { return chip(b.name + (b.monthly ? " −" + man(b.monthly) : ""), S.bundle === b.id, function () { set({ bundle: b.id }); }); })),
        group("제휴카드 (월)", D.cards.map(function (v) { return chip(v ? "−" + man(v) : "없음", S.card === v, function () { set({ card: v }); }); })),
      ]);
    },
    result: function () {
      var q = quote(S), p = q.pick, m = byId(D.models, S.model);
      var cmp = function (x, name) {
        return el("div", { class: "cmp" + (q.best === x.method ? " best" : "") + (p.method === x.method ? " on" : "") }, [
          el("small", { text: name }), el("b", { text: man(x.total) }), el("span", { text: "총 " + x.months + "개월" }),
        ]);
      };
      return el("div", { class: "result" }, [
        el("div", { class: "hero-num" }, [
          el("small", { text: m.short + " " + S.storage + " · " + byId(D.carriers, S.carrier).name + " " + byId(D.joinTypes, S.join).name }),
          el("div", { class: "big" }, [el("span", { text: "할부원금" }), el("b", { text: won(p.principal) })]),
          el("div", { class: "pair" }, [
            el("div", {}, [el("span", { text: "월 · 6개월" }), el("b", { text: won(p.first) })]),
            el("div", {}, [el("span", { text: "월 · 이후" }), el("b", { text: won(p.after) })]),
          ]),
        ]),
        el("div", { class: "cmps" }, [cmp(q.sub, "공시지원금"), cmp(q.con, "선택약정")]),
        el("div", { class: "grid g3 actions" }, [
          tile({ title: "견적서", icon: "🧾", onclick: openReceipt }),
          tile({ title: "카톡 복사", icon: "💬", onclick: function () { copy(quoteText()); } }),
          tile({ title: "알림표", icon: "⏰", onclick: function () { setMode("care"); } }),
        ]),
        el("p", { class: "fine", text: "예시 정책 기준 · 개통 시 확정 · 할부이자 연 " + (D.installmentRate * 100).toFixed(1) + "%" }),
      ]);
    },
    check: function () {
      var n = S.checks.length, all = D.checklist.length;
      return el("div", {}, [
        el("div", { class: "meter", style: "--p:" + (n / all) }, [el("b", { text: n + " / " + all })]),
        el("div", { class: "grid g5" }, D.checklist.map(function (c) {
          var on = S.checks.indexOf(c.id) > -1;
          return tile({ title: c.name, icon: c.icon, on: on, cls: "check", onclick: function () {
            set({ checks: on ? S.checks.filter(function (x) { return x !== c.id; }) : S.checks.concat(c.id) });
            if (!on && S.checks.length === all) toast("개통 준비 완료");
          } });
        })),
      ]);
    },
  };

  function renderQuote() {
    renderSteps();
    var st = $("#stage"); st.innerHTML = "";
    st.appendChild(VIEWS[STEPS[S.step].key]());
    $("#prevBtn").disabled = S.step === 0;
    var last = S.step === STEPS.length - 1;
    $("#nextBtn").textContent = last ? "완료" : "다음";
    $("#nextBtn").disabled = !last && !STEPS[S.step].ready();
    renderDock();
  }
  function renderDock() {
    var m = byId(D.models, S.model);
    $("#dockModel").textContent = m ? m.short + (S.storage ? " " + S.storage : "") : "기종 선택";
    var ok = S.model && S.storage && S.carrier && S.join && S.plan;
    var q = ok ? quote(S).pick : null;
    $("#dockPrin").textContent = q ? man(q.principal) : "–";
    $("#dockMonth").textContent = q ? man(q.first) : "–";
  }

  /* ---------- 견적서 / 문구 ---------- */
  function quoteText() {
    var q = quote(S), p = q.pick, m = byId(D.models, S.model);
    var hi = byId(D.plans, S.plan), lo = byId(D.plans, S.planAfter || S.plan);
    var lines = [
      "[" + D.shop.name + " 견적]",
      m.name + " " + S.storage + " · " + byId(D.carriers, S.carrier).name + " " + byId(D.joinTypes, S.join).name,
      "요금제 " + won(hi.price) + (lo.id !== hi.id ? " → " + D.highPlanDays + "일 후 " + won(lo.price) : ""),
      (p.method === "sub" ? "공시지원금 " + won(p.sub) : "선택약정 25%") + (S.extra ? " · 추가 " + won(S.extra) : "") + (S.trade ? " · 반납 " + won(S.trade) : ""),
      "할부원금 " + won(p.principal) + (S.months ? " (" + S.months + "개월)" : " (현금완납)"),
      "월 납부 " + won(p.first) + " → 이후 " + won(p.after),
      p.months + "개월 총액 " + won(p.total),
      "※ 예시 정책 기준, 개통 시 확정",
    ];
    if (D.shop.phone) lines.push("문의 " + D.shop.phone);
    return lines.join("\n");
  }
  function openReceipt() {
    var q = quote(S), p = q.pick;
    var rows = [
      ["출고가", won(p.price)],
      [p.method === "sub" ? "공시지원금" : "선택약정", p.method === "sub" ? "−" + won(p.sub) : "요금 25%↓"],
      ["추가지원금", "−" + won(S.extra)],
      ["중고 반납", "−" + won(S.trade)],
      ["할부원금", won(p.principal)],
      ["할부이자 합계", won(p.interest)],
      ["월 기기값", won(p.devMonthly)],
      ["월 납부(6개월)", won(p.first)],
      ["월 납부(이후)", won(p.after)],
      ["부가서비스 합계", won(addonCost(S.addons))],
      [p.months + "개월 총액", won(p.total)],
    ];
    var body = $("#receiptBody"); body.innerHTML = "";
    body.appendChild(el("dl", { class: "rows" }, rows.reduce(function (a, r) {
      return a.concat([el("dt", { text: r[0] }), el("dd", { text: r[1] })]);
    }, [])));
    $("#receipt").showModal();
  }

  /* ---------- 시세표 디자이너 ---------- */
  var THEMES = [
    { name: "나이트", bg: "#0E0F1A", card: "#1A1C2E", ink: "#FFFFFF", sub: "#A3A8C3", accent: "#FF5A36" },
    { name: "화이트", bg: "#F6F5F2", card: "#FFFFFF", ink: "#14151F", sub: "#6B6E80", accent: "#3B5BFF" },
    { name: "옐로", bg: "#FFD23F", card: "#FFF6D1", ink: "#1E2A5A", sub: "#5A6286", accent: "#1E2A5A" },
  ];
  function boardRows() {
    var b = S.board;
    return b.models.map(function (id) {
      var m = byId(D.models, id); if (!m) return null;
      var cap = Object.keys(m.prices)[0];
      var o = { model: id, storage: cap, carrier: b.carrier, join: b.join, plan: b.plan, planAfter: b.plan, sub: null,
        extra: b.extra, trade: 0, months: 24, bundle: "none", card: 0, addons: [] };
      var r = calc(o, b.method);
      return { m: m, cap: cap, r: r };
    }).filter(Boolean);
  }
  function renderBoard() {
    var b = S.board, box = $("#boardControls"); box.innerHTML = "";
    var up = function (patch) { Object.assign(S.board, patch); save(); renderBoard(); };
    box.appendChild(group("통신사", D.carriers.map(function (c) { return chip(c.name, b.carrier === c.id, function () { up({ carrier: c.id }); }); })));
    box.appendChild(group("가입", D.joinTypes.map(function (j) { return chip(j.name, b.join === j.id, function () { up({ join: j.id }); }); })));
    box.appendChild(group("요금제", D.plans.map(function (p) { return chip(man(p.price), b.plan === p.id, function () { up({ plan: p.id }); }); })));
    box.appendChild(group("방식", [chip("공시지원금", b.method === "sub", function () { up({ method: "sub" }); }), chip("선택약정", b.method === "con", function () { up({ method: "con" }); })]));
    box.appendChild(group("추가지원금", D.extraSupport.map(function (v) { return chip(v ? man(v) : "0", b.extra === v, function () { up({ extra: v }); }); })));
    box.appendChild(group("기종", D.models.map(function (m) {
      var on = b.models.indexOf(m.id) > -1;
      return chip(m.short, on, function () { up({ models: on ? b.models.filter(function (x) { return x !== m.id; }) : b.models.concat(m.id) }); });
    }), "wrap"));
    box.appendChild(group("테마", THEMES.map(function (t, i) { return chip(t.name, b.theme === i, function () { up({ theme: i }); }); })));
    drawBoard();
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawBoard() {
    var cv = $("#boardCanvas"), rows = boardRows(), t = THEMES[S.board.theme] || THEMES[0], b = S.board;
    var W = 1080, rowH = 132, top = 330, H = Math.max(1080, top + rows.length * (rowH + 18) + 170);
    cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d"), F = "'Noto Sans KR', system-ui, sans-serif";
    ctx.fillStyle = t.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = t.accent; ctx.font = "800 44px " + F; ctx.fillText(D.shop.name, 72, 120);
    ctx.fillStyle = t.ink; ctx.font = "800 84px " + F; ctx.fillText("오늘의 시세표", 72, 220);
    var c = byId(D.carriers, b.carrier), j = byId(D.joinTypes, b.join), p = byId(D.plans, b.plan);
    ctx.fillStyle = t.sub; ctx.font = "600 34px " + F;
    var d = new Date();
    ctx.fillText(c.name + " · " + j.name + " · 요금 " + man(p.price) + " · " + (b.method === "sub" ? "공시" : "선약") + " · " + (d.getMonth() + 1) + "/" + d.getDate(), 72, 282);
    rows.forEach(function (row, i) {
      var y = top + i * (rowH + 18);
      ctx.fillStyle = t.card; roundRect(ctx, 56, y, W - 112, rowH, 28); ctx.fill();
      ctx.fillStyle = t.ink; ctx.font = "800 44px " + F; ctx.fillText(row.m.short, 96, y + 62);
      ctx.fillStyle = t.sub; ctx.font = "600 28px " + F; ctx.fillText(row.cap + " · 출고 " + man(row.r.price), 96, y + 104);
      ctx.textAlign = "right";
      ctx.fillStyle = t.accent; ctx.font = "800 56px " + F; ctx.fillText(row.r.principal ? man(row.r.principal) : "0원", W - 96, y + 70);
      ctx.fillStyle = t.sub; ctx.font = "600 26px " + F; ctx.fillText("월 " + won(row.r.devMonthly) + " · 24개월", W - 96, y + 108);
      ctx.textAlign = "left";
    });
    ctx.fillStyle = t.sub; ctx.font = "600 26px " + F;
    ctx.fillText("할부원금 기준 · 예시 정책 · 개통 시 확정" + (D.shop.phone ? " · " + D.shop.phone : ""), 72, H - 72);
  }
  function boardText() {
    var b = S.board, c = byId(D.carriers, b.carrier), j = byId(D.joinTypes, b.join), p = byId(D.plans, b.plan);
    return ["[" + D.shop.name + " 시세표] " + c.name + " " + j.name + " · 요금 " + won(p.price) + " · " + (b.method === "sub" ? "공시지원금" : "선택약정")]
      .concat(boardRows().map(function (r) { return "▪ " + r.m.short + " " + r.cap + "  " + won(r.r.principal) + "원"; }))
      .concat(["※ 할부원금 기준, 예시 정책"]).join("\n");
  }

  /* ---------- 사후관리 알림표 ---------- */
  function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function addMonths(d, n) {
    var x = new Date(d.getFullYear(), d.getMonth() + n, 1);
    var last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
    x.setDate(Math.min(d.getDate(), last)); return x;
  }
  function parse(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function careEvents() {
    var d0 = parse(S.careDate || ymd(new Date()));
    var H = S.months || 24;
    var plan = new Date(Math.max(addMonths(d0, 6).getTime(), addDays(d0, D.highPlanDays).getTime()));
    var end = addMonths(d0, H);
    var ev = [{ date: d0, title: "개통", icon: "📱" }];
    S.addons.forEach(function (id) {
      var a = byId(D.addons, id); if (a) ev.push({ date: addMonths(d0, a.keep), title: a.name + " 해지 가능", icon: "✂" });
    });
    ev.push({ date: addDays(plan, -3), title: "요금제 변경 D-3", icon: "🔔" });
    ev.push({ date: plan, title: "요금제 변경 가능", icon: "⬇", key: true });
    ev.push({ date: addMonths(end, -1), title: "약정 만료 1개월 전", icon: "🔔" });
    ev.push({ date: addDays(end, -14), title: "약정 만료 2주 전", icon: "🔔" });
    ev.push({ date: addDays(end, -7), title: "약정 만료 1주 전", icon: "🔔" });
    ev.push({ date: end, title: "약정 만료 · 기기 교체", icon: "★", key: true });
    return ev.sort(function (a, b) { return a.date - b.date; });
  }
  function renderCare() {
    var input = $("#careDate"); if (!S.careDate) S.careDate = ymd(new Date());
    input.value = S.careDate;
    var q = $("#careQuick"); q.innerHTML = "";
    q.appendChild(chip("오늘", S.careDate === ymd(new Date()), function () { S.careDate = ymd(new Date()); save(); renderCare(); }));
    D.months.filter(Boolean).forEach(function (n) {
      q.appendChild(chip(n + "개월 약정", (S.months || 24) === n, function () { S.months = n; save(); renderCare(); renderDock(); }));
    });
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var ol = $("#timeline"); ol.innerHTML = "";
    careEvents().forEach(function (e) {
      var dd = Math.round((e.date - today) / 864e5);
      ol.appendChild(el("li", { class: (e.key ? "key " : "") + (dd < 0 ? "past" : "") }, [
        el("span", { class: "ic", text: e.icon }),
        el("b", { text: e.title }),
        el("time", { datetime: ymd(e.date), text: ymd(e.date).replace(/-/g, ".") }),
        el("em", { text: dd === 0 ? "오늘" : (dd > 0 ? "D-" + dd : "지남") }),
      ]));
    });
  }
  function ics() {
    var stamp = ymd(new Date()).replace(/-/g, "") + "T000000Z";
    var out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//phoneparis//dealer-studio//KO", "CALSCALE:GREGORIAN"];
    careEvents().forEach(function (e, i) {
      var d = ymd(e.date).replace(/-/g, ""), n = ymd(addDays(e.date, 1)).replace(/-/g, "");
      out.push("BEGIN:VEVENT", "UID:pp-" + d + "-" + i + "@phoneparis", "DTSTAMP:" + stamp,
        "DTSTART;VALUE=DATE:" + d, "DTEND;VALUE=DATE:" + n, "SUMMARY:[" + D.shop.name + "] " + e.title,
        "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + e.title, "TRIGGER:PT9H", "END:VALARM", "END:VEVENT");
    });
    out.push("END:VCALENDAR");
    return out.join("\r\n");
  }
  function download(name, blob) {
    var a = el("a", { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function careText() {
    return ["[" + D.shop.name + " 알림표]"].concat(careEvents().map(function (e) {
      return ymd(e.date).replace(/-/g, ".") + "  " + e.title;
    })).concat(["※ 매장 계약 조건이 우선합니다"]).join("\n");
  }

  /* ---------- 모드 / 테마 ---------- */
  function setMode(mode) {
    document.querySelectorAll(".modes [role=tab]").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.mode === mode ? "true" : "false"); });
    document.querySelectorAll(".mode").forEach(function (s) { var on = s.id === mode; s.hidden = !on; s.classList.toggle("is-on", on); });
    document.body.dataset.mode = mode;
    if (mode === "board") renderBoard();
    if (mode === "care") renderCare();
    if (mode === "quote") renderQuote();
  }
  function initTheme() {
    var order = ["system", "light", "dark"], icons = { system: "◐", light: "☀", dark: "☾" };
    var cur = "system"; try { cur = localStorage.getItem("pp-theme") || "system"; } catch (e) {}
    var apply = function () {
      if (cur === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = cur;
      $("#themeBtn").textContent = icons[cur]; $("#themeBtn").title = "테마: " + cur;
    };
    $("#themeBtn").addEventListener("click", function () {
      cur = order[(order.indexOf(cur) + 1) % 3]; try { localStorage.setItem("pp-theme", cur); } catch (e) {} apply();
    });
    apply();
  }

  /* ---------- 시작 ---------- */
  function init() {
    $("#shopName").textContent = D.shop.name; $("#shopTag").textContent = D.shop.tagline;
    document.querySelectorAll(".modes [role=tab]").forEach(function (b) { b.addEventListener("click", function () { setMode(b.dataset.mode); }); });
    $("#prevBtn").addEventListener("click", function () { go(S.step - 1); });
    $("#nextBtn").addEventListener("click", function () {
      if (S.step === STEPS.length - 1) { toast("견적 완료"); setMode("care"); } else go(S.step + 1);
    });
    $("#resetBtn").addEventListener("click", function () {
      var keep = { board: S.board }; S = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), keep); save(); setMode("quote");
    });
    $("#dock").addEventListener("click", function () { if (S.model && S.storage && S.carrier && S.join && S.plan) openReceipt(); else setMode("quote"); });
    $("#copyQuote").addEventListener("click", function () { copy(quoteText()); });
    document.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", function () { $("#receipt").close(); }); });
    $("#receipt").addEventListener("click", function (e) { if (e.target === this) this.close(); });
    $("#boardPng").addEventListener("click", function () {
      $("#boardCanvas").toBlob(function (bl) { download("phoneparis-board-" + ymd(new Date()) + ".png", bl); toast("저장했어요"); });
    });
    $("#boardCopy").addEventListener("click", function () { copy(boardText()); });
    $("#careDate").addEventListener("change", function () { if (this.value) { S.careDate = this.value; save(); renderCare(); } });
    $("#icsBtn").addEventListener("click", function () { download("phoneparis-alarm.ics", new Blob([ics()], { type: "text/calendar" })); toast("캘린더 파일 저장"); });
    $("#careCopy").addEventListener("click", function () { copy(careText()); });
    document.addEventListener("keydown", function (e) {
      if (document.body.dataset.mode !== "quote" || $("#receipt").open || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight" && !$("#nextBtn").disabled) go(S.step + 1);
      if (e.key === "ArrowLeft") go(S.step - 1);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (document.body.dataset.mode === "board") drawBoard(); });
    initTheme();
    if (!canEnter(S.step)) S.step = 0;
    setMode("quote");
  }

  // 테스트용 노출
  window.PP = { calc: calc, quote: quote, defaultSubsidy: defaultSubsidy, careEvents: careEvents, ics: ics, state: function () { return S; } };
  init();
})();
