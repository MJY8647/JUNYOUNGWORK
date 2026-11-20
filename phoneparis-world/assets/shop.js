/* 폰파리 가게 — 1mm STORE v6 판매 흐름 + v6 상품·지원금 계산(catalog.js) + 폰팔이별 셀링포인트
 * 폰(제조사 → 카테고리 → 모델 → 색·용량) → [셀링포인트] → 상담 → 견적 → 계약 → 배송 → 완료
 */
(function () {
  "use strict";
  var D = window.SITE, K = D.shop, C = window.CAT, $ = function (s) { return document.querySelector(s); };
  var won = function (n) { return Math.round(n).toLocaleString("ko-KR") + "원"; };
  var man = function (n) { n = Math.round(n / 1000) * 1000; if (Math.abs(n) < 10000) return won(n); var m = n / 10000; return (Number.isInteger(m) ? m : m.toFixed(1)) + "만"; };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var byId = function (list, id) { return list.filter(function (x) { return x.id === id; })[0]; };

  var POINT_LABEL = { designer: "폰꾸", quick: "받는 법", price: "우선순위", safe: "보호", used: "중고 고르기", allinone: "맡기기" };
  var MISSION = function (d) { return [["📱", "폰"], ["★", POINT_LABEL[d]], ["💬", "상담"], ["🧾", "견적"], ["✍️", "계약"], ["📦", "배송"], ["🎉", "완료"]]; };
  var CURS = [["skt", "SKT"], ["kt", "KT"], ["lgu", "LG U+"], ["mvno", "알뜰폰"], ["mvno2", "자급제폰"], ["none", "새로 개통"]];
  var DATA_OPTS = [[0, "적게", "카톡·검색", "▁"], [1, "적당히", "영상 가끔", "▃"], [2, "넉넉히", "영상 자주", "▅"], [5, "무제한", "다 써도 5Mbps", "█"]];

  var G, CUR, HIST, typing, opts = {};
  function fresh(dealer) {
    return {
      dealer: dealer, brand: "apple", tab: null, md: null, si: 0, ci: 0,
      deco: { case: "clear", keyring: "none", back: "none" },
      quick: { speed: "now", open: "after" }, focus: "monthly",
      safe: { case: true, film: true, care: true }, stamps: {}, usedId: null, auto: false,
      cur: null, bundle: "free", tier: null, pick: null, con: null, months: 24,
      member: false, agree: {}, signed: false, ink: 0, ship: null, f: { name: "", phone: "", addr: "" }, err: {}, no: null,
    };
  }
  function sync() { C.S.member = G.member; C.S.bundle = G.bundle; C.S.planSel = {}; }
  var curKey = function () { return G.cur === "mvno2" ? "mvno" : G.cur; };
  var sto = function () { return G.md.storages[G.si]; };
  var colors = function () { return C.colorsOf(G.md); };
  var img = function (md, ci) { return C.imgOf(md, ci); };

  /* ---------- 지원금 요약 (진열대 가격표용) ---------- */
  function bestSupport(md) { // 3사 중 가장 큰 기기값 지원 (공시 + 추가 + 1mm 매장 지원), 번호이동 · 무제한 기준
    var s = md.storages[0]; sync();
    var L = C.calcOptions(s, "mvno", 5, 24, "sub");
    var best = L.reduce(function (a, o) { var t = o.subsidy + o.extra + C.MM_SUPPORT; return t > a.t ? { t: t, o: o } : a; }, { t: 0, o: null });
    return best;
  }
  function usedUnits(md) { return C.USED.filter(function (u) { return u.name === md.name && C.stock(u) > 0; }); }

  /* ---------- 사는 방법 (v6 waysList + 폰팔이별 비용) ---------- */
  function extras() {
    var today = 0, monthly = 0, lines = [];
    if (G.dealer === "designer") {
      var st = D.studio;
      [["케이스", st.cases, G.deco.case], ["키링", st.keyrings, G.deco.keyring], ["뒷면", st.backs, G.deco.back]].forEach(function (x) {
        var o = byId(x[1], x[2]); if (o && o.price) { today += o.price; lines.push([x[0] + " · " + o.name, o.price]); }
      });
    }
    if (G.dealer === "safe") K.safeItems.forEach(function (it) {
      if (!G.safe[it.id]) return;
      if (it.price) { today += it.price; lines.push([it.name, it.price]); }
      if (it.monthly) { monthly += it.monthly; lines.push([it.name + " (월)", it.monthly, true]); }
    });
    return { today: today, monthly: monthly, lines: lines };
  }
  function ways() {
    sync();
    var s = sto(), cur = curKey(), x = extras(), out = [], t = G.tier == null ? 5 : G.tier;
    if (G.dealer !== "used") {
      var by = {};
      C.calcOptions(s, cur, t, 24, "best").forEach(function (o) { var k = o.id.split("-")[0]; if (!by[k] || o.grand < by[k].grand) by[k] = o; });
      Object.keys(by).forEach(function (k) {
        var o = by[k];
        out.push({ id: "c:" + k, kind: "carrier", k: k, title: o.carrier + " " + o.way, sub: (o.con === "sub" ? "공시지원금" : "선택약정 25%") + " · " + o.planName, o: o,
          support: o.saved, monthly: o.monthly + x.monthly, today: o.upfront + x.today, grand: o.grand + x.today + x.monthly * 24 });
      });
      var sp = C.selfPlan(t, cur), price = Math.max(0, s.price - (G.member ? C.MEMBER_DC : 0)), dev = C.monthlyInstall(price, 24);
      out.push({ id: "self", kind: "self", title: "자급제 새 폰", sub: "약정 없음 · " + sp.label, sp: sp, price: price,
        support: G.member ? C.MEMBER_DC : 0, monthly: dev + sp.fee + x.monthly, today: x.today, grand: (dev + sp.fee) * 24 + x.today + x.monthly * 24 });
    }
    usedUnits(G.md).forEach(function (u) {
      if (G.dealer === "used" && G.usedId && u.id !== G.usedId) return;
      var sp = C.selfPlan(t, cur), price = Math.max(0, u.price - (G.member ? C.MEMBER_DC : 0)), d = C.monthlyInstall(price, 24);
      out.push({ id: "u:" + u.id, kind: "used", it: u, title: "1mm 중고 " + u.grade + "급", sub: u.gb + " · 배터리 " + u.battery + "% · " + C.stock(u) + "대", sp: sp, price: price,
        support: sto().price - u.price + (G.member ? C.MEMBER_DC : 0), monthly: d + sp.fee + x.monthly, today: x.today, grand: (d + sp.fee) * 24 + x.today + x.monthly * 24 });
    });
    var key = G.dealer === "price" ? G.focus : "monthly";
    return out.sort(function (a, b) { return key === "today" ? (a.today - b.today) || (a.monthly - b.monthly) : key === "total" ? a.grand - b.grand : a.monthly - b.monthly; });
  }
  function curWay() { var L = ways(); return L.filter(function (w) { return w.id === G.pick; })[0] || L[0]; }
  function carrierQ(con) { var w = curWay(); sync(); return C.calcOptions(sto(), curKey(), G.tier == null ? 5 : G.tier, G.months, con).filter(function (o) { return o.id === w.k + "-" + con; })[0]; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function fmtD(d) { return (d.getMonth() + 1) + "/" + d.getDate(); }

  /* ---------- 테이블 위 물건 ---------- */
  var P = {};
  function tabsOf(b) { return C.catTabs(b, function (c) { return C.allModels(C.DATA[b].cats[c]).some(function (m) { return !m.soon && m.storages && m.storages.length; }); }); }
  P.model = function () {
    if (!G.tab) { // 중고폰팔이는 재고가 있는 카테고리부터
      var tl = tabsOf(G.brand), first = tl[0];
      if (G.dealer === "used") first = tl.filter(function (t) { return t[1].some(function (ck) { return C.allModels(C.DATA[G.brand].cats[ck]).some(function (m) { return usedUnits(m).length; }); }); })[0] || first;
      G.tab = first[0];
    }
    var tab = tabsOf(G.brand).filter(function (t) { return t[0] === G.tab; })[0] || tabsOf(G.brand)[0];
    var ms = []; tab[1].forEach(function (ck) { C.allModels(C.DATA[G.brand].cats[ck]).forEach(function (m) { if (!m.soon && m.storages && m.storages.length) ms.push(m); }); });
    if (G.dealer === "price") ms.sort(function (a, b) { var A = bestSupport(a), B = bestSupport(b); return (a.storages[0].price - A.t) - (b.storages[0].price - B.t); });
    var h = '<div class="brands">' + [["apple", "Apple"], ["samsung", "Samsung"]].map(function (b) { return '<button class="' + (G.brand === b[0] ? "on" : "") + '" data-act="brand" data-v="' + b[0] + '">' + b[1] + '</button>'; }).join("") + '</div>';
    h += '<div class="ctabs">' + tabsOf(G.brand).map(function (t) { return '<button class="' + (t[0] === tab[0] ? "on" : "") + '" data-act="tab" data-v="' + t[0] + '">' + esc(t[2]) + '</button>'; }).join("") + '</div>';
    h += '<div class="shelf">' + ms.map(function (m) {
      var s = m.storages[0], b = bestSupport(m), used = usedUnits(m).length, dis = G.dealer === "used" && !used;
      var pay = Math.max(0, s.price - b.t);
      return '<button class="pk' + (dis ? " dis" : "") + '" data-act="model" data-v="' + esc(m.name) + '"' + (dis ? " disabled" : "") + '><span class="im"><img src="' + img(m, 0) + '" alt="" loading="lazy"></span><span class="tag"><b>' + esc(m.name) + '</b>' +
        (G.dealer === "used" ? '<span>' + (used ? "중고 " + man(Math.min.apply(null, usedUnits(m).map(function (u) { return u.price; }))) + "~" : "재고 없음") + '</span>' :
          '<s>' + man(s.price) + '</s><span>' + (pay ? man(pay) : "0원") + '</span><em>지원 ' + man(b.t) + '</em>') + '</span></button>';
    }).join("") + '</div><div class="foot">' + (G.dealer === "used" ? "1mm 검수 중고 재고" : "번호이동 · 무제한 요금제 · 공시지원금 기준 할부원금 · 지원 = 공시 + 추가 + 1mm 매장 지원") + '</div>';
    return h;
  };
  P.spec = function () {
    var cs = colors(), s = sto(), fold = window.PV3D && PV3D.foldable(G.md);
    var h = '<div class="pv3d" id="pvHost"><img class="pvimg" src="' + img(G.md, G.ci) + '" alt=""></div>';
    if (fold) h += '<div class="foldseg"><button class="' + (G.open === false ? "on" : "") + '" data-act="fold" data-v="0">📕 접은 상태</button><button class="' + (G.open !== false ? "on" : "") + '" data-act="fold" data-v="1">📖 펼친 상태</button></div>';
    var own = cs[G.ci] && cs[G.ci].img; // 그 색의 실제 사진이 없으면 대표 사진임을 표시
    h += '<div class="pick-row"><img src="' + img(G.md, G.ci) + '" alt=""><span><b>' + esc(G.md.name) + '</b><em>' + esc((cs[G.ci] || {}).n || "") + ' · 출고가 ' + won(s.price) + (cs.length && !own ? ' <i class="src">대표 사진</i>' : "") + '</em></span></div>';
    if (cs.length > 1) h += '<div class="tl">🎨 색상<small>' + esc(cs[G.ci].n) + '</small></div><div class="chips2">' + cs.map(function (c, i) { return '<button class="' + (G.ci === i ? "on" : "") + '" style="background:' + c.h + '" aria-label="' + esc(c.n) + '" data-act="ci" data-v="' + i + '"></button>'; }).join("") + '</div>';
    h += '<div class="tl">📦 용량<small>상자를 골라 주세요</small></div><div class="boxes">' + G.md.storages.map(function (st, i) {
      return '<button class="pbox' + (G.si === i ? " on" : "") + '" data-act="sto" data-v="' + i + '"><span class="lid"></span><span class="bd"><b>' + st.gb + '</b><span>' + won(st.price) + '</span></span></button>';
    }).join("") + '</div>';
    var b = bestSupport(G.md);
    if (b.o) h += supportBox([["공시지원금", b.o.subsidy, b.o.pubLabel], ["추가지원금", b.o.extra, b.o.extraSrc === "market" ? "성지 시세 반영" : "예시"], ["1mm 매장 지원", C.MM_SUPPORT, "모든 개통"]], b.o.carrier + " 번호이동 · 무제한 기준 최대");
    return h;
  };
  function supportBox(rows, title) {
    var tot = rows.reduce(function (a, r) { return a + r[1]; }, 0);
    return '<div class="sup"><div class="tl dark">💸 받을 수 있는 지원금<small>' + esc(title) + '</small></div>' + rows.map(function (r) {
      return '<div class="ln m"><span>' + esc(r[0]) + (r[2] ? ' <i class="src">' + esc(r[2]) + '</i>' : "") + '</span><b>-' + won(r[1]) + '</b></div>';
    }).join("") + '<div class="ln t"><span>지원 합계</span><b>-' + won(tot) + '</b></div></div>';
  }
  P.point = function () {
    var id = G.dealer, h = "";
    if (id === "designer") {
      var st = D.studio;
      [["케이스", "case", st.cases], ["키링", "keyring", st.keyrings], ["뒷면", "back", st.backs]].forEach(function (x) {
        h += '<div class="tl">' + x[0] + '</div><div class="opts3">' + x[2].map(function (o) {
          return '<button class="tok' + (G.deco[x[1]] === o.id ? " on" : "") + '" data-act="deco" data-k="' + x[1] + '" data-v="' + o.id + '">' + (o.c ? '<i style="background:' + o.c + '"></i>' : '<i class="none"></i>') + '<b>' + esc(o.name) + '</b><small>' + (o.price ? man(o.price) : "0원") + '</small></button>';
        }).join("") + '</div>';
      });
      h += '<button class="wide" data-act="studio">🌀 3D로 돌려 보기</button>';
    } else if (id === "quick") {
      h += '<div class="tl">받는 속도</div><div class="veh">' + K.quickSpeed.map(function (o) { return '<button class="' + (G.quick.speed === o.id ? "on" : "") + '" data-act="qs" data-v="' + o.id + '"><i>' + o.icon + '</i><b>' + o.name + '</b><span>' + o.sub + '</span></button>'; }).join("") + '</div>';
      h += '<div class="tl">개통 시점</div><div class="two">' + K.quickOpen.map(function (o) { return '<button class="tok' + (G.quick.open === o.id ? " on" : "") + '" data-act="qo" data-v="' + o.id + '"><b>' + o.name + '</b><small>' + o.sub + '</small></button>'; }).join("") + '</div>';
      var now = new Date(), late = now.getDay() === 0 || now.getDay() === 6 || now.getHours() >= 16;
      if (G.quick.speed === "now") h += '<div class="memo">' + (late ? "⏰ 지금은 16시 이후·주말이라 다음 평일 출발해요" : "⏰ 지금 신청하면 오늘 출발해요") + '</div>';
    } else if (id === "price") {
      h += '<div class="tl">제일 중요한 것 하나</div><div class="veh">' + K.priceFocus.map(function (o) { return '<button class="' + (G.focus === o.id ? "on" : "") + '" data-act="focus" data-v="' + o.id + '"><i>' + o.icon + '</i><b>' + o.name + '</b><span>' + o.sub + '</span></button>'; }).join("") + '</div>';
      h += '<div class="memo">견적에서 이 기준으로 줄 세워 드려요</div>';
    } else if (id === "safe") {
      h += '<div class="tl">지킬 것 고르기</div><div class="veh">' + K.safeItems.map(function (o) { return '<button class="' + (G.safe[o.id] ? "on" : "") + '" data-act="safe" data-v="' + o.id + '"><i>' + o.icon + '</i><b>' + o.name + '</b><span>' + (o.price ? won(o.price) : "월 " + won(o.monthly)) + '</span></button>'; }).join("") + '</div>';
      h += '<div class="tl">약속 도장<small>눌러서 확인</small></div><div class="paper">' + K.safePromises.map(function (t, i) { return '<button class="cl' + (G.stamps[i] ? " on" : "") + '" data-act="stamp" data-v="' + i + '"><span class="st">' + (G.stamps[i] ? "약속" : "") + '</span><span>' + esc(t) + '</span></button>'; }).join("") + '</div>';
    } else if (id === "used") {
      var units = usedUnits(G.md);
      h += '<div class="tl">재고에서 한 대 고르기<small>' + units.length + '종</small></div><div class="ways">' + units.map(function (u) {
        return '<button class="way' + (G.usedId === u.id ? " on" : "") + '" data-act="unit" data-v="' + u.id + '"><span class="n">' + u.grade + '</span><span>' + esc(u.name) + ' ' + u.gb + '<em>배터리 ' + u.battery + '% · ' + u.colors.filter(function (c) { return c.qty; }).map(function (c) { return c.name; }).join(" · ") + '</em></span><strong>' + man(u.price) + '<small>새 폰보다 -' + man(sto().price - u.price) + '</small></strong></button>';
      }).join("") + '</div><div class="paper"><div class="tl dark">1mm 검수표</div>' + K.usedChecks.map(function (t) { return '<div class="ck">✓ ' + esc(t) + '</div>'; }).join("") + '</div>';
    } else {
      h += '<div class="auto"><b>모델만 골랐어요</b><span>통신사·요금제·지원금·할부는<br>가장 싼 조건으로 맞출게요</span></div>';
    }
    return h;
  };
  function summaryRow() { var cs = colors(); return '<div class="pick-row"><img src="' + img(G.md, G.ci) + '" alt=""><span><b>' + esc(G.md.name) + ' ' + sto().gb + '</b><em>' + esc((cs[G.ci] || {}).n || "") + ' · 출고가 ' + won(sto().price) + '</em></span></div>'; }
  P.cur = function () { return summaryRow() + '<div class="tl">지금 쓰는 통신사<small>번호이동·기기변경 지원금이 달라요</small></div>'; };
  P.bundle = function () { return summaryRow() + '<div class="tl">' + esc(C.CARRIERS[curKey()].name) + ' 가족·인터넷 결합</div>'; };
  P.data = function () {
    return '<div class="tl">한 달 데이터</div><div class="veh four">' + DATA_OPTS.map(function (d) {
      return '<button class="' + (G.tier === d[0] ? "on" : "") + '" data-act="tier" data-v="' + d[0] + '"><i>' + d[3] + '</i><b>' + d[1] + '</b><span>' + d[2] + '</span></button>';
    }).join("") + '</div>';
  };
  P.calc = function () { return '<div class="loading"><i></i><i></i><i></i><span>3사 공시·추가지원금 · 자급제 · 중고 계산 중</span></div>'; };
  P.quote = function () {
    var L = ways(), w = curWay(), key = G.dealer === "price" ? G.focus : "monthly";
    var lbl = { monthly: "월 납부 싼 순", today: "오늘 내는 돈 순", total: "2년 총액 순" }[key];
    return '<div class="tl">' + esc(G.md.name) + ' ' + sto().gb + ' · ' + lbl + '</div><div class="ways">' + L.map(function (m, i) {
      var v = key === "today" ? m.today : key === "total" ? m.grand : m.monthly;
      return '<button class="way' + (m.id === w.id ? " on" : "") + '" data-act="way" data-v="' + m.id + '">' + (i === 0 ? '<i class="best">최저</i>' : "") +
        '<span class="n">' + (i + 1) + '</span><span>' + esc(m.title) + '<em>' + esc(m.sub) + '</em>' + (m.support ? '<em class="sv">지원 ' + man(m.support) + '</em>' : "") + '</span><strong>' + (key === "monthly" ? "월 " : "") + man(v) + '<small>' + (key === "monthly" ? "2년 " + man(m.grand) : "월 " + man(m.monthly)) + '</small></strong></button>';
    }).join("") + '</div><div class="foot">월 납부 = 기기값 24개월 할부(연 5.9%) + 요금 · 공시지원금 SKT 공식(' + C.OFFICIAL.date + ')·KT 공통지원금(KT초이스), LG U+ 예시 · 추가지원금 성지 시세(' + C.MARKET.date + ')</div>';
  };
  function coins() {
    return '<div class="coins">' + [0, 12, 24, 36].map(function (m) { return '<button class="coin' + (G.months === m ? " on" : "") + '" data-act="months" data-v="' + m + '">' + (m ? m + "<small>개월</small>" : "일시불") + '</button>'; }).join("") + '</div>';
  }
  function billCarrier(q) {
    var x = extras(), h = '<div class="bill"><div class="ln"><span>출고가</span><b>' + won(q.price) + '</b></div>';
    if (q.subsidy) h += '<div class="ln m"><span>공시지원금 <i class="src">' + esc(q.pubLabel) + '</i></span><b>-' + won(q.subsidy) + '</b></div>';
    h += '<div class="ln m"><span>추가지원금 <i class="src">' + (q.extraSrc === "market" ? "성지 시세 반영" : q.way + " 예시") + '</i></span><b>-' + won(q.extra) + '</b></div>';
    h += '<div class="ln m"><span>1mm 매장 지원</span><b>-' + won(C.MM_SUPPORT) + '</b></div>';
    if (q.mem) h += '<div class="ln m"><span>1mm 멤버십</span><b>-' + won(q.mem) + '</b></div>';
    h += '<div class="ln t"><span>내는 기기값</span><b>' + won(q.principal) + '</b></div>';
    h += '<div class="ln"><span>요금제 ' + esc(q.planName) + '</span><b>월 ' + won(q.planMonthly + q.planDiscount + q.bundleDc) + '</b></div>';
    if (q.planDiscount) h += '<div class="ln m"><span>선택약정 25% 요금 할인</span><b>-월 ' + won(q.planDiscount) + '</b></div>';
    if (q.bundleDc) h += '<div class="ln m"><span>' + esc(q.bundleName) + '</span><b>-월 ' + won(q.bundleDc) + '</b></div>';
    x.lines.forEach(function (l) { h += '<div class="ln"><span>' + esc(l[0]) + '</span><b>' + (l[2] ? "월 " : "") + won(l[1]) + '</b></div>'; });
    h += '<div class="big"><div><span>오늘</span><b>' + won(q.upfront + x.today) + '</b></div><div><span>매달' + (G.months ? " " + G.months + "개월" : "") + '</span><b>' + won(q.monthly + x.monthly) + '</b></div><div><span>2년 받는 혜택</span><b>' + man(q.saved) + '</b></div></div>';
    h += '<div class="memo">📅 요금제는 ' + fmtD(addDays(new Date(), K.keepDays)) + '부터 바꿔도 돼요 (' + K.keepDays + '일)</div>';
    return h + '</div>';
  }
  function billPhone(w) {
    var x = extras(), base = w.kind === "used" ? w.it.price : sto().price, price = w.price, n = G.months, mi = n ? C.monthlyInstall(price, n) : 0;
    var h = '<div class="bill"><div class="ln"><span>' + (w.kind === "used" ? "새 폰 출고가" : "출고가") + '</span><b>' + won(sto().price) + '</b></div>';
    if (w.kind === "used") h += '<div class="ln m"><span>중고 ' + w.it.grade + '급 가격</span><b>-' + won(sto().price - w.it.price) + '</b></div>';
    if (G.member) h += '<div class="ln m"><span>1mm 멤버십</span><b>-' + won(C.MEMBER_DC) + '</b></div>';
    h += '<div class="ln t"><span>폰값</span><b>' + won(price) + '</b></div>';
    h += '<div class="ln"><span>요금 (' + esc(w.sp.label) + ')</span><b>월 ' + won(w.sp.fee) + '</b></div>';
    x.lines.forEach(function (l) { h += '<div class="ln"><span>' + esc(l[0]) + '</span><b>' + (l[2] ? "월 " : "") + won(l[1]) + '</b></div>'; });
    h += '<div class="big"><div><span>오늘</span><b>' + won((n ? 0 : price) + x.today) + '</b></div><div><span>매달</span><b>' + won(mi + w.sp.fee + x.monthly) + '</b></div></div>';
    if (w.kind === "used") h += '<div class="memo">✓ IMEI 조회 · 통화·카메라·충전 점검 · 초기화 완료</div>';
    void base; return h + '</div>';
  }
  P.cond = function () {
    var w = curWay();
    if (w.kind === "carrier") {
      var a = carrierQ("sub"), b = carrierQ("sel24"), win = a.grand <= b.grand ? "sub" : "sel24"; if (!G.con) G.con = win;
      return '<div class="tl">할인은 하나만</div><div class="cards">' + [["sub", "a", "💳", "공시지원금", "기기값 ↓ " + man(a.subsidy), a], ["sel24", "b", "📉", "선택약정 25%", "요금 ↓ 월 " + man(b.planDiscount), b]].map(function (x) {
        return '<button class="dcard ' + x[1] + (G.con === x[0] ? " on" : "") + '" data-act="con" data-v="' + x[0] + '">' + (win === x[0] ? '<i class="win">2년 더 쌈</i>' : "") + '<span class="ic">' + x[2] + '</span><b>' + x[3] + '</b><span>' + x[4] + '</span><strong>월 ' + man(x[5].monthly) + '</strong><em>2년 ' + man(x[5].grand) + '</em></button>';
      }).join("") + '</div><div class="tl">기기값 내는 방법</div>' + coins() + billCarrier(G.con === "sub" ? a : b);
    }
    return '<div class="tl">' + (w.kind === "used" ? "중고폰 값 내는 방법" : "폰값 내는 방법") + '</div>' + coins() + billPhone(w);
  };
  P.join = function () {
    return '<div class="mcard"><span class="l">1mm</span><div><div class="v">-' + man(C.MEMBER_DC) + '</div><small>이번 구매 바로 할인 · 약정 끝 알림 · 가입비 0원</small></div></div>' +
      '<div class="social"><button class="k" data-act="join">카카오</button><button class="n" data-act="join">네이버</button><button class="g" data-act="join">구글</button></div>';
  };
  function needAgree() { return K.agree.filter(function (a) { return a.id !== "a2" || curWay().kind === "carrier"; }); }
  P.agree = function () {
    return '<div class="tl">전자 계약서<small>도장 찍고 서명</small></div><div class="paper">' + needAgree().map(function (a) {
      return '<button class="cl' + (G.agree[a.id] ? " on" : "") + (G.err[a.id] ? " err" : "") + '" data-act="agree" data-v="' + a.id + '"><span class="st">' + (G.agree[a.id] ? "확인" : "") + '</span><span><b>' + esc(a.t) + '</b>' + (a.d ? "<em>" + esc(a.d) + "</em>" : "") + '</span></button>';
    }).join("") + '<div class="sign' + (G.err.sign ? " err" : "") + '"><span>여기에 손가락으로 서명</span><i class="x">✕</i><canvas id="signPad" aria-label="서명"></canvas></div></div>';
  };
  P.ship = function () {
    var f = G.f, E = G.err;
    var fl = function (id, l, ph, ex) { return '<div class="fl' + (E[id] ? " err" : "") + '"><label for="f_' + id + '">' + l + '</label><input id="f_' + id + '" value="' + esc(f[id]) + '" placeholder="' + ph + '" ' + (ex || "") + ' data-f="' + id + '">' + (E[id] ? '<span class="e">' + E[id] + '</span>' : "") + '</div>'; };
    return '<div class="tl">받는 방법</div><div class="veh">' + K.ship.map(function (s) { return '<button class="' + (G.ship === s.id ? "on" : "") + '" data-act="ship" data-v="' + s.id + '"><i>' + s.icon + '</i><b>' + s.name + '</b><span>' + s.sub + '</span></button>'; }).join("") + '</div>' +
      (G.ship === "quick" ? '<div class="memo">📞 기사님 확인 전화를 꼭 받아 주세요</div>' : "") +
      '<div class="tl">받는 분</div>' + fl("name", "이름", "홍길동", 'autocomplete="name"') + fl("phone", "연락처", "010-0000-0000", 'inputmode="numeric" autocomplete="tel" maxlength="13"') +
      (G.ship !== "store" ? fl("addr", "주소", "서울 강남구 …", 'autocomplete="street-address"') : "");
  };
  function pointSummary() {
    var id = G.dealer, st = D.studio;
    if (id === "designer") return [byId(st.cases, G.deco.case).name + " 케이스", byId(st.keyrings, G.deco.keyring).name, byId(st.backs, G.deco.back).name].filter(function (x) { return x !== "없음"; }).join(" · ");
    if (id === "quick") return byId(K.quickSpeed, G.quick.speed).name + " · " + byId(K.quickOpen, G.quick.open).name;
    if (id === "price") return byId(K.priceFocus, G.focus).name;
    if (id === "safe") return K.safeItems.filter(function (o) { return G.safe[o.id]; }).map(function (o) { return o.name; }).join(" + ") || "선택 안 함";
    if (id === "used") { var u = curWay().it; return u ? u.grade + "급 · 배터리 " + u.battery + "%" : "-"; }
    return "최저 조건 자동";
  }
  function orderLines() {
    var w = curWay(), cs = colors(), ship = byId(K.ship, G.ship) || {}, today, mon;
    if (w.kind === "carrier") { var q = carrierQ(G.con || w.o.con), x = extras(); today = q.upfront + x.today; mon = q.monthly + x.monthly; }
    else { var x2 = extras(), mi = G.months ? C.monthlyInstall(w.price, G.months) : 0; today = (G.months ? 0 : w.price) + x2.today; mon = mi + w.sp.fee + x2.monthly; }
    var L = [["폰", G.md.name + " " + (w.kind === "used" ? w.it.gb : sto().gb) + ((cs[G.ci] || {}).n ? " · " + cs[G.ci].n : "")],
      ["사는 방법", w.title + (w.kind === "carrier" ? " · " + (G.con === "sub" ? "공시지원금" : "선택약정") : "") + " · " + (G.months ? G.months + "개월" : "일시불")],
      [POINT_LABEL[G.dealer], pointSummary()]];
    if (w.support) L.push(["받은 지원", man(w.kind === "carrier" ? carrierQ(G.con || w.o.con).saved : w.support)]);
    L.push(["오늘", won(today)], ["매달", won(mon)], ["받는 방법", (ship.icon || "") + " " + (ship.name || "")]);
    if (G.f.name) L.push(["받는 분", G.f.name]);
    return L;
  }
  P.review = function () {
    return '<div class="paper rcpt review"><h3>주문 내역</h3><div class="no">결제 전에 한 번 더 확인</div>' +
      orderLines().map(function (l) { return '<div class="ln"><span>' + esc(l[0]) + '</span><b>' + esc(l[1]) + '</b></div>'; }).join("") +
      '<div class="foot center">프로토타입 · 실제 결제는 되지 않아요</div></div>';
  };
  P.done = function () {
    return '<div class="paper rcpt"><h3>phoneparis</h3><div class="no">' + G.no + ' · ' + esc(D.dealers[G.dealer].name) + '</div><span class="done">주문 접수</span>' +
      orderLines().map(function (l) { return '<div class="ln"><span>' + esc(l[0]) + '</span><b>' + esc(l[1]) + '</b></div>'; }).join("") +
      '<div class="ln"><span>불량 교환</span><b>받은 날부터 7일</b></div><div class="foot center">문의 ' + D.contact.phone + ' · 프로토타입</div></div>';
  };

  /* ---------- 대본: 폰팔이마다 자기 말투 (content.js의 say) ---------- */
  function line(key, vars) {
    var say = D.dealers[G.dealer].say || {}, t = say[key] || (key === "quoteAuto" ? say.quote : "") || "";
    return t.replace(/\{(\w+)\}/g, function (_, k) { return vars && vars[k] != null ? vars[k] : ""; });
  }
  // 폰팔이 얼굴 아바타 (CSS로 그린 몸 + 마우스를 따라보는 눈)
  function ava(id, cls) { return '<i class="ava' + (cls ? " " + cls : "") + '" data-d="' + id + '" aria-hidden="true"><i class="eye"><i></i></i><i class="eye"><i></i></i></i>'; }
  var STEPS = {
    model: { q: 0, t: function () { return line("model"); }, panel: "model" },
    spec: { q: 0, t: function () { return line("spec", { model: esc(G.md.name) }); }, panel: "spec", ch: function () { return [["이걸로", function () { G.usedId = null; go("point"); }, "go"], ["다른 폰", function () { go("model"); }]]; } },
    point: { q: 1, t: function () { return line("point"); }, panel: "point", ch: function () {
      if (G.dealer === "allinone") return [["🙌 알아서 해 줘", function () { G.auto = true; G.cur = "mvno"; G.bundle = "free"; G.tier = 5; G.months = 24; G.pick = null; G.con = null; go("calc"); }, "go"], ["내가 고를래", function () { G.auto = false; go("cur"); }]];
      if (G.dealer === "used") return [["이 중고로", function () { if (!G.usedId) { var u = usedUnits(G.md)[0]; G.usedId = u && u.id; } go("cur"); }, "go"]];
      return [["좋아, 다음", function () { go("cur"); }, "go"]];
    } },
    cur: { q: 2, t: function () { return line("cur"); }, panel: "cur", grid: true, ch: function () {
      return CURS.map(function (c) { return [c[1], function () { G.cur = c[0]; go(C.CARRIERS[curKey()] ? "bundle" : "data"); }]; });
    } },
    bundle: { q: 2, t: function () { return line("bundle"); }, panel: "bundle", ch: function () {
      return [["있어 · 유지", function () { G.bundle = "keep"; go("data"); }], ["없어 · 최저가", function () { G.bundle = "free"; go("data"); }, "go"]];
    } },
    data: { q: 2, t: function () { return line("data"); }, panel: "data" },
    calc: { q: 3, t: function () { return line("calc"); }, panel: "calc", auto: 1300, next: "quote" },
    quote: { q: 3, t: function () {
      var L = ways(); if (G.auto) { G.pick = L[0].id; G.con = L[0].o ? L[0].o.con : null; }
      return line(G.auto ? "quoteAuto" : "quote", { best: esc(L[0].title) });
    }, panel: "quote", ch: function () { return [[G.auto ? "이대로 할게" : "이 방법으로", function () { if (!G.pick) G.pick = ways()[0].id; go(G.auto ? "join" : "cond"); }, "go"]]; } },
    cond: { q: 3, t: function () { return line(curWay().kind === "carrier" ? "condCarrier" : "condPhone"); }, panel: "cond", ch: function () { return [["좋아", function () { go(G.member ? "agree" : "join"); }, "go"], ["견적 다시", function () { go("quote"); }]]; } },
    join: { q: 4, t: function () { return line("join", { dc: man(C.MEMBER_DC) }); }, panel: "join", ch: function () { return [["다음에", function () { go("agree"); }]]; } },
    joined: { q: 4, t: function () { return line("joined", { dc: man(C.MEMBER_DC) }); }, panel: "join", auto: 1200, next: "agree" },
    agree: { q: 4, t: function () { return line("agree"); }, panel: "agree", ch: function () { return [["서명 완료", signDone, "go"]]; } },
    ship: { q: 5, t: function () { return line("ship"); }, panel: "ship", ch: function () { return [["주문 내역 확인", function () { if (formOk()) go("review"); else repaint(); }, "go"]]; } },
    review: { q: 5, t: function () { return line("review"); }, panel: "review", ch: function () {
      return [["✏️ 수정", function () { go("ship"); }], ["💳 결제하기", function () { var d = new Date(); G.no = "PP-" + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "-" + (1000 + Math.floor(Math.random() * 9000)); go("done"); }, "go"]];
    } },
    done: { q: 6, t: function () { return line("done", { name: esc(G.f.name) }); }, panel: "done", ch: function () { return [["광장으로", function () { close(); }, "go"], ["처음부터", function () { open(G.dealer); }]]; } },
  };
  function signDone() {
    G.err = {}; needAgree().forEach(function (a) { if (!G.agree[a.id]) G.err[a.id] = 1; }); if (!G.signed) G.err.sign = 1;
    if (Object.keys(G.err).length) { repaint(); toast(G.err.sign && Object.keys(G.err).length === 1 ? "서명해 주세요" : "항목을 모두 확인해 주세요"); return; }
    if (!G.ship) G.ship = G.dealer === "quick" ? { now: "quick", visit: "store", parcel: "parcel" }[G.quick.speed] : "quick";
    go("ship");
  }
  function formOk() {
    var f = G.f, E = {};
    if (!f.name.trim()) E.name = "이름을 입력해 주세요";
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(f.phone.trim())) E.phone = "010-1234-5678처럼";
    if (G.ship !== "store" && !f.addr.trim()) E.addr = "주소를 입력해 주세요";
    if (G.ship === "quick" && /제주/.test(f.addr)) E.addr = "제주는 퀵 불가 · 택배로";
    G.err = E; return !Object.keys(E).length;
  }

  /* ---------- 진행 ---------- */
  var timers = [];
  function go(id, back) {
    timers.forEach(clearTimeout); timers = [];
    if (!back && CUR && CUR !== id && !STEPS[CUR].auto) HIST.push(CUR);
    CUR = id; if (id !== "agree" && id !== "ship") G.err = {};
    var st = STEPS[id];
    renderMission(st.q);
    $("#shopBack").hidden = !HIST.length || id === "done";
    var panel = $("#shopPanel");
    if (st.panel) { panel.hidden = false; panel.classList.add("enter"); panel.innerHTML = P[st.panel](); panel.scrollTop = 0; if (st.panel === "agree") initSign(); mount3D(); }
    else panel.hidden = true;
    $("#shopCh").innerHTML = ""; $("#shopCh").className = "sch" + (st.grid ? " grid" : "");
    type(st.t());
    if (st.auto) timers.push(setTimeout(function () { go(st.next); }, st.auto));
  }
  function back() { var p = HIST.pop(); if (p) go(p, true); }
  function repaint() { var st = STEPS[CUR], el = $("#shopPanel"), y = el.scrollTop; if (st.panel) { el.classList.remove("enter"); el.innerHTML = P[st.panel](); el.scrollTop = y; if (st.panel === "agree") initSign(); mount3D(); } }
  // 실측 3D 폰: 색·용량 단계에서 띄우고, 접는 폰은 접은/펼친 상태 전환
  function mount3D() {
    var host = $("#pvHost");
    if (!host || !window.PV3D) { if (window.PV3D) PV3D.hide(); return; }
    if (PV3D.show(G.md, G.ci, host)) { host.classList.add("live"); PV3D.setOpen(G.open !== false); }
  }
  var full = "";
  var TYPE_SPEED = { designer: [2, 22], quick: [3, 14], price: [1, 26], safe: [1, 30], used: [2, 20], allinone: [1, 28] };
  function type(html) {
    var p = $("#shopTxt"); full = html; var plain = html.replace(/<[^>]+>/g, ""), i = 0;
    if (typing) clearInterval(typing);
    if (opts.onTalk) opts.onTalk(true);
    $("#shopDlg").classList.add("typing");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    p.textContent = "";
    var sp = TYPE_SPEED[G.dealer] || [2, 22]; // 말투 속도: 퀵퀵이는 빠르게, 세이프티·올인원은 느긋하게
    typing = setInterval(function () { i += sp[0]; p.textContent = plain.slice(0, i); if (i >= plain.length) finish(); }, sp[1]);
  }
  function finish() {
    if (typing) clearInterval(typing); typing = null; $("#shopTxt").innerHTML = full; $("#shopDlg").classList.remove("typing");
    if (opts.onTalk) opts.onTalk(false);
    var st = STEPS[CUR], ch = $("#shopCh");
    if (st.ch && !ch.children.length) st.ch().forEach(function (c, i) {
      var b = document.createElement("button"); b.className = "say" + (c[2] ? " go" : ""); b.style.setProperty("--i", i);
      var t = document.createElement("span"); t.textContent = c[0]; b.appendChild(t);
      if (c[2]) { var ar = document.createElement("i"); ar.className = "arr"; ar.setAttribute("aria-hidden", "true"); ar.textContent = "→"; b.appendChild(ar); }
      b.onclick = c[1]; ch.appendChild(b);
    });
  }
  function renderMission(q) {
    var ol = $("#mission"); ol.innerHTML = "";
    MISSION(G.dealer).forEach(function (m, i) {
      var li = document.createElement("li"); li.className = (i < q ? "on" : "") + (i === q ? " now" : "") + (i === 2 && G.auto && q > 2 ? " skip" : "");
      li.innerHTML = "<i>" + m[0] + "</i><span>" + m[1] + "</span>"; ol.appendChild(li);
    });
  }
  function toast(t) { if (opts.toast) opts.toast(t); }
  function initSign() {
    var c = $("#signPad"); if (!c) return;
    var r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); c.width = r.width * dpr; c.height = r.height * dpr;
    var x = c.getContext("2d"); x.scale(dpr, dpr); x.lineWidth = 2.6; x.lineCap = "round"; x.strokeStyle = "#1E2A5A";
    if (G.sig) { var im = new Image(); im.onload = function () { x.drawImage(im, 0, 0, r.width, r.height); }; im.src = G.sig; }
    var last = null, pt = function (e) { var b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    c.onpointerdown = function (e) { c.setPointerCapture(e.pointerId); last = pt(e); };
    c.onpointermove = function (e) { if (!last) return; var p = pt(e); x.beginPath(); x.moveTo(last[0], last[1]); x.lineTo(p[0], p[1]); x.stroke(); G.ink += Math.hypot(p[0] - last[0], p[1] - last[1]); last = p; };
    c.onpointerup = function () { last = null; if (G.ink > 40) { G.signed = true; G.sig = c.toDataURL(); if (G.err.sign) { delete G.err.sign; c.parentNode.classList.remove("err"); } } };
  }

  function onPanel(e) {
    var b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
    var a = b.dataset.act, v = b.dataset.v;
    if (a === "brand") { G.brand = v; G.tab = null; }
    if (a === "tab") G.tab = v;
    if (a === "model") { var x = C.mmModelOf(v); G.md = x.m; G.si = 0; G.ci = 0; G.open = true; go("spec"); return; }
    if (a === "ci") G.ci = +v;
    if (a === "fold") { G.open = v === "1"; if (window.PV3D) PV3D.setOpen(G.open); b.parentNode.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); }); return; }
    if (a === "sto") G.si = +v;
    if (a === "deco") { G.deco[b.dataset.k] = v; }
    if (a === "studio") { if (opts.openStudio) opts.openStudio(G); return; }
    if (a === "qs") G.quick.speed = v;
    if (a === "qo") G.quick.open = v;
    if (a === "focus") G.focus = v;
    if (a === "safe") G.safe[v] = !G.safe[v];
    if (a === "stamp") G.stamps[v] = !G.stamps[v];
    if (a === "unit") G.usedId = v;
    if (a === "tier") { G.tier = +v; go("calc"); return; }
    if (a === "way") { G.pick = v; G.con = null; }
    if (a === "con") G.con = v;
    if (a === "months") G.months = +v;
    if (a === "join") { G.member = true; toast("🎉 -" + man(C.MEMBER_DC) + " 멤버십 등록!"); go("joined"); return; }
    if (a === "agree") { G.agree[v] = !G.agree[v]; delete G.err[v]; }
    if (a === "ship") G.ship = v;
    repaint();
  }

  function open(dealer) {
    G = fresh(dealer); HIST = []; CUR = null;
    var d = D.dealers[dealer], sec = $("#shop");
    sec.hidden = false; sec.style.setProperty("--c", d.color); sec.style.setProperty("--dk", d.ink || "#202529"); sec.dataset.dealer = dealer;
    $("#shopDlg").dataset.emote = d.emote || "";
    $("#shopWho").innerHTML = ava(dealer, "sm") + "<span>" + esc(d.name) + "</span>";
    document.documentElement.classList.add("shopping");
    go("model");
  }
  function close() {
    timers.forEach(clearTimeout); if (typing) clearInterval(typing); typing = null;
    $("#shop").hidden = true; document.documentElement.classList.remove("shopping"); if (window.PV3D) PV3D.hide();
    if (opts.onClose) opts.onClose();
  }
  function init(o) {
    opts = o || {};
    $("#shopPanel").addEventListener("click", onPanel);
    $("#shopPanel").addEventListener("input", function (e) { var f = e.target.dataset.f; if (f) G.f[f] = e.target.value; });
    $("#shopDlg").addEventListener("click", function () { if (typing) finish(); });
    $("#shopBack").addEventListener("click", back);
    $("#shopExit").addEventListener("click", close);
    addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#shop").hidden && !document.querySelector("dialog[open]")) close(); });
  }
  window.PPShop = {
    init: init, open: open, close: close, go: go, repaint: repaint,
    state: function () { return G; }, step: function () { return CUR; },
    setDeco: function (deco) { if (G) { Object.assign(G.deco, deco); if (CUR === "point") repaint(); } },
    methods: function () { return ways(); }, way: function () { return curWay(); }, ava: ava,
  };
})();
