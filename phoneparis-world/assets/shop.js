/* 폰파리 가게 — 1mm STORE v6 판매 흐름 + 폰팔이별 셀링포인트 결정
 * 폰 → [셀링포인트] → 상담 → 견적 → 계약 → 배송 → 완료
 * 폰팔이가 말하고(대사창), 소비자는 말풍선 버튼과 테이블 위 물건을 눌러 넘어갑니다.
 */
(function () {
  "use strict";
  var D = window.SITE, K = D.shop, $ = function (s) { return document.querySelector(s); };
  var won = function (n) { return Math.round(n).toLocaleString("ko-KR") + "원"; };
  var man = function (n) { n = Math.round(n / 1000) * 1000; if (Math.abs(n) < 10000) return won(n); var m = n / 10000; return (Number.isInteger(m) ? m : m.toFixed(1)) + "만"; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var byId = function (list, id) { return list.filter(function (x) { return x.id === id; })[0]; };

  var POINT_LABEL = { designer: "폰꾸", quick: "받는 법", price: "우선순위", safe: "보호", used: "등급", allinone: "맡기기" };
  var MISSION = function (d) { return [["📱", "폰"], ["★", POINT_LABEL[d]], ["💬", "상담"], ["🧾", "견적"], ["✍️", "계약"], ["📦", "배송"], ["🎉", "완료"]]; };

  var G, CUR, HIST, typing, opts = {};
  function fresh(dealer) {
    return {
      dealer: dealer, model: null, ci: 0, sto: "256GB",
      deco: { case: "clear", keyring: "none", back: "none" },
      quick: { speed: "now", open: "after" }, focus: "monthly",
      safe: { case: true, film: true, care: true }, stamps: {},
      used: { grade: "S", bat: "85" }, auto: false,
      cur: null, bundle: "free", tier: null, method: null, con: null, months: 24,
      member: false, agree: {}, signed: false, ink: 0, ship: null, f: { name: "", phone: "", addr: "" }, err: {}, no: null,
    };
  }

  /* ---------- 계산 ---------- */
  function prod() {
    var p = D.products[G.model], add = (D.storageAdd || {})[G.sto] || 0;
    return { name: p.name, list: p.list + add, price: p.price + add, p: p };
  }
  function inst(principal, n) { if (!n || principal <= 0) return 0; var r = K.rate / 12; return principal * r / (1 - Math.pow(1 + r, -n)); }
  function extras() { // 폰팔이 셀링포인트로 붙는 비용
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
  function tier() { return byId(K.tiers, G.tier || "mid"); }
  function priced(m, con, months) { // 방법 하나의 금액
    var P = prod(), t = tier(), x = extras(), dev, plan;
    if (m.kind === "carrier") {
      var c = byId(K.carriers, m.carrier), chg = m.join === "chg";
      var fee = t.fee[c.id] - (G.bundle === "keep" && chg ? K.bundleDc : 0);
      if (con === "sel") { dev = P.list - Math.round(P.list * K.selSupportRate / 1000) * 1000; plan = Math.round(fee * (1 - K.selRate)); }
      else { dev = P.price + c.add + (chg ? K.chgAdd : 0); plan = fee; }
    } else if (m.kind === "self") { dev = P.list; plan = t.mvno; }
    else { var gr = byId(K.usedGrades, G.used.grade), bt = byId(K.usedBattery, G.used.bat); dev = Math.round(P.list * gr.rate / 1000) * 1000 + bt.add; plan = t.mvno; }
    if (G.member) dev -= K.memberDc;
    dev = Math.max(0, dev);
    var n = months == null ? G.months : months, mi = inst(dev, n);
    var today = (n ? 0 : dev) + x.today, monthly = mi + plan + x.monthly;
    var total = dev + (mi * n - (n ? dev : 0)) + (plan + x.monthly) * 24 + x.today;
    return { dev: dev, plan: plan, inst: mi, today: today, monthly: monthly, total: total, con: con, extras: x };
  }
  function methods() {
    var L = [];
    if (G.dealer === "used") L.push({ id: "used", kind: "used", title: "중고 " + byId(K.usedGrades, G.used.grade).name, sub: "1mm 검수 · 배터리 " + byId(K.usedBattery, G.used.bat).name });
    else {
      var keep = G.bundle === "keep" && byId(K.carriers, G.cur);
      K.carriers.forEach(function (c) {
        if (keep && c.id !== G.cur) return;
        var join = G.cur === c.id ? "chg" : "mnp";
        L.push({ id: c.id, kind: "carrier", carrier: c.id, join: join, title: c.name + " " + (join === "chg" ? "기기변경" : "번호이동"), sub: tier().label + " 요금제 " + man(tier().fee[c.id]) });
      });
      L.push({ id: "self", kind: "self", title: "자급제 + 알뜰폰", sub: "약정 없음 · 요금 " + man(tier().mvno) });
    }
    L.forEach(function (m) {
      if (m.kind === "carrier") { var a = priced(m, "sub"), b = priced(m, "sel"); m.best = a.total <= b.total ? "sub" : "sel"; m.q = m.best === "sub" ? a : b; }
      else m.q = priced(m, null);
    });
    var key = G.dealer === "price" ? G.focus : "monthly";
    L.sort(function (a, b) { return key === "today" ? (a.q.today - b.q.today) || (a.q.monthly - b.q.monthly) : key === "total" ? a.q.total - b.q.total : a.q.monthly - b.q.monthly; });
    return L;
  }
  function curMethod() { var L = methods(); return L.filter(function (m) { return m.id === G.method; })[0] || L[0]; }
  function quoteNow() { var m = curMethod(); return priced(m, m.kind === "carrier" ? (G.con || m.best) : null); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function fmtD(d) { return (d.getMonth() + 1) + "/" + d.getDate(); }

  /* ---------- 테이블 위 물건 (패널) ---------- */
  function phoneIcon(p, col) { return '<span class="ph' + (p.folder ? " folder" : "") + '" style="--c:' + (col || p.color) + '"></span>'; }
  var P = {};
  P.model = function () {
    var d = D.dealers[G.dealer], ids = (d.products || Object.keys(D.products)).slice();
    if (G.dealer === "price") ids.sort(function (a, b) { return D.products[a].price - D.products[b].price; });
    return '<div class="tl">📱 폰 고르기<small>' + ids.length + '개</small></div><div class="shelf">' + ids.map(function (id) {
      var p = D.products[id];
      return '<button class="pk' + (G.model === id ? " on" : "") + '" data-act="model" data-v="' + id + '"><span class="im">' + phoneIcon(p) + '</span><span class="tag"><b>' + esc(p.name) + '</b><span>' + (p.price ? man(p.price) : "0원") + '</span>' + (p.tag ? '<em>' + p.tag + '</em>' : "") + '</span></button>';
    }).join("") + '</div>';
  };
  P.spec = function () {
    var p = D.products[G.model];
    var stos = p.folder || G.model === "a17" ? ["256GB"] : Object.keys(D.storageAdd);
    return '<div class="pick-row">' + phoneIcon(p, p.colors[G.ci][1]) + '<span><b>' + esc(p.name) + '</b><em>' + esc(p.colors[G.ci][0]) + '</em></span></div>' +
      '<div class="tl">🎨 색상</div><div class="chips2">' + p.colors.map(function (c, i) { return '<button class="' + (G.ci === i ? "on" : "") + '" style="background:' + c[1] + '" aria-label="' + esc(c[0]) + '" data-act="ci" data-v="' + i + '"></button>'; }).join("") + '</div>' +
      '<div class="tl">📦 용량<small>상자를 골라 주세요</small></div><div class="boxes">' + stos.map(function (s) {
        var P2 = prod.call(null), add = D.storageAdd[s] - (D.storageAdd[G.sto] || 0);
        return '<button class="pbox' + (G.sto === s ? " on" : "") + '" data-act="sto" data-v="' + s + '"><span class="lid"></span><span class="bd"><b>' + s.replace("GB", "") + (/TB/.test(s) ? "" : "GB") + '</b><span>' + won(P2.list + add) + '</span></span></button>';
      }).join("") + '</div>';
  };
  P.point = function () {
    var id = G.dealer, h = "";
    if (id === "designer") {
      var st = D.studio;
      [["케이스", "case", st.cases], ["키링", "keyring", st.keyrings], ["뒷면", "back", st.backs]].forEach(function (x) {
        h += '<div class="tl">' + x[0] + '</div><div class="opts3">' + x[2].map(function (o) {
          var on = G.deco[x[1]] === o.id;
          return '<button class="tok' + (on ? " on" : "") + '" data-act="deco" data-k="' + x[1] + '" data-v="' + o.id + '">' + (o.c ? '<i style="background:' + o.c + '"></i>' : '<i class="none"></i>') + '<b>' + esc(o.name) + '</b><small>' + (o.price ? man(o.price) : "0원") + '</small></button>';
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
      h += '<div class="tl">등급</div><div class="two">' + K.usedGrades.map(function (o) { return '<button class="tok' + (G.used.grade === o.id ? " on" : "") + '" data-act="grade" data-v="' + o.id + '"><b>' + o.name + '</b><small>' + o.d + ' · 출고가 ' + Math.round(o.rate * 100) + '%</small></button>'; }).join("") + '</div>';
      h += '<div class="tl">배터리</div><div class="two">' + K.usedBattery.map(function (o) { return '<button class="tok' + (G.used.bat === o.id ? " on" : "") + '" data-act="bat" data-v="' + o.id + '"><b>' + o.name + '</b><small>' + (o.add ? "+" + man(o.add) : "기본") + '</small></button>'; }).join("") + '</div>';
      h += '<div class="paper"><div class="tl dark">1mm 검수표</div>' + K.usedChecks.map(function (t) { return '<div class="ck">✓ ' + esc(t) + '</div>'; }).join("") + '</div>';
    } else {
      h += '<div class="auto"><b>모델만 골랐어요</b><span>통신사·요금제·할인·할부는<br>가장 싼 조건으로 맞출게요</span></div>';
    }
    return h;
  };
  P.cur = function () { return '<div class="tl">지금 쓰는 통신사</div>' + summaryRow(); };
  P.bundle = function () { return '<div class="tl">' + esc(byId(K.carriers, G.cur).name) + ' 가족·인터넷 결합</div>' + summaryRow(); };
  P.data = function () {
    return '<div class="tl">한 달 데이터</div><div class="veh">' + K.tiers.map(function (t) {
      return '<button class="' + (G.tier === t.id ? "on" : "") + '" data-act="tier" data-v="' + t.id + '"><i>' + { low: "▁", mid: "▃", high: "█" }[t.id] + '</i><b>' + t.label + '</b><span>' + t.sub + '</span></button>';
    }).join("") + '</div>';
  };
  P.calc = function () { return '<div class="loading"><i></i><i></i><i></i><span>3사 · 자급제' + (G.dealer === "used" ? " · 중고" : "") + ' 계산 중</span></div>'; };
  P.quote = function () {
    var L = methods(), w = curMethod(), key = G.dealer === "price" ? G.focus : "monthly";
    var lbl = { monthly: "월 납부 싼 순", today: "오늘 내는 돈 순", total: "2년 총액 순" }[key];
    return '<div class="tl">' + esc(prod().name) + ' · ' + lbl + '</div><div class="ways">' + L.map(function (m, i) {
      var v = key === "today" ? m.q.today : key === "total" ? m.q.total : m.q.monthly;
      return '<button class="way' + (m.id === w.id ? " on" : "") + '" data-act="method" data-v="' + m.id + '">' + (i === 0 ? '<i class="best">최저</i>' : "") +
        '<span class="n">' + (i + 1) + '</span><span>' + esc(m.title) + '<em>' + esc(m.sub) + '</em></span><strong>' + (key === "monthly" ? "월 " : "") + man(v) + '<small>' + (key === "monthly" ? "2년 " + man(m.q.total) : "월 " + man(m.q.monthly)) + '</small></strong></button>';
    }).join("") + '</div><div class="foot">기기값 할부 연 ' + (K.rate * 100).toFixed(1) + '% 가정 · 예시 정책</div>';
  };
  function coins() {
    return '<div class="coins">' + K.months.map(function (m) { return '<button class="coin' + (G.months === m ? " on" : "") + '" data-act="months" data-v="' + m + '">' + (m ? m + "<small>개월</small>" : "일시불") + '</button>'; }).join("") + '</div>';
  }
  function bill(q, m) {
    var P2 = prod(), h = '<div class="bill"><div class="ln"><span>출고가</span><b>' + won(P2.list) + '</b></div>';
    var disc = P2.list - q.dev - (G.member ? K.memberDc : 0);
    if (disc > 0) h += '<div class="ln m"><span>' + (m.kind === "used" ? "중고 할인" : q.con === "sel" ? "매장 지원" : "공시·매장 지원") + '</span><b>-' + won(disc) + '</b></div>';
    if (G.member) h += '<div class="ln m"><span>1mm 멤버십</span><b>-' + won(K.memberDc) + '</b></div>';
    h += '<div class="ln t"><span>내는 기기값</span><b>' + won(q.dev) + '</b></div>';
    h += '<div class="ln"><span>요금제' + (q.con === "sel" ? " (25%↓)" : "") + '</span><b>월 ' + won(q.plan) + '</b></div>';
    q.extras.lines.forEach(function (l) { h += '<div class="ln"><span>' + esc(l[0]) + '</span><b>' + (l[2] ? "월 " : "") + won(l[1]) + '</b></div>'; });
    h += '<div class="big"><div><span>오늘</span><b>' + won(q.today) + '</b></div><div><span>매달' + (G.months ? " " + G.months + "개월" : "") + '</span><b>' + won(q.monthly) + '</b></div></div>';
    if (m.kind === "carrier") h += '<div class="memo">📅 요금제는 ' + fmtD(addDays(new Date(), K.keepDays)) + '부터 바꿔도 돼요 (' + K.keepDays + '일)</div>';
    return h + '</div>';
  }
  P.cond = function () {
    var m = curMethod();
    if (m.kind === "carrier") {
      var a = priced(m, "sub"), b = priced(m, "sel"), win = a.total <= b.total ? "sub" : "sel"; if (!G.con) G.con = win;
      return '<div class="tl">할인은 하나만</div><div class="cards">' + [["sub", "a", "💳", "공시지원금", "기기값 ↓", a], ["sel", "b", "📉", "선택약정 25%", "요금 ↓", b]].map(function (x) {
        return '<button class="dcard ' + x[1] + (G.con === x[0] ? " on" : "") + '" data-act="con" data-v="' + x[0] + '">' + (win === x[0] ? '<i class="win">2년 더 쌈</i>' : "") + '<span class="ic">' + x[2] + '</span><b>' + x[3] + '</b><span>' + x[4] + '</span><strong>월 ' + man(x[5].monthly) + '</strong><em>2년 ' + man(x[5].total) + '</em></button>';
      }).join("") + '</div><div class="tl">기기값 내는 방법</div>' + coins() + bill(G.con === "sub" ? a : b, m);
    }
    return '<div class="tl">' + (m.kind === "used" ? "중고폰 값 내는 방법" : "폰값 내는 방법") + '</div>' + coins() + bill(priced(m, null), m);
  };
  P.join = function () {
    return '<div class="mcard"><span class="l">1mm</span><div><div class="v">-' + man(K.memberDc) + '</div><small>이번 구매 바로 할인 · 약정 끝 알림 · 가입비 0원</small></div></div>' +
      '<div class="social"><button class="k" data-act="join">카카오</button><button class="n" data-act="join">네이버</button><button class="g" data-act="join">구글</button></div>';
  };
  P.agree = function () {
    var need = K.agree.filter(function (a) { return a.id !== "a2" || curMethod().kind === "carrier"; });
    return '<div class="tl">전자 계약서<small>도장 찍고 서명</small></div><div class="paper">' + need.map(function (a) {
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
  function orderLines() {
    var m = curMethod(), q = quoteNow(), P2 = prod(), p = D.products[G.model], ship = byId(K.ship, G.ship) || {};
    var L = [["폰", P2.name + " " + G.sto + " · " + p.colors[G.ci][0]], ["사는 방법", m.title + (m.kind === "carrier" ? " · " + (G.con === "sel" ? "선택약정" : "공시지원금") : "") + " · " + (G.months ? G.months + "개월" : "일시불")]];
    L.push([POINT_LABEL[G.dealer], pointSummary()]);
    L.push(["오늘", won(q.today)], ["매달", won(q.monthly)]);
    L.push(["받는 방법", (ship.icon || "") + " " + (ship.name || "")]);
    if (G.f.name) L.push(["받는 분", G.f.name]);
    return L;
  }
  function pointSummary() {
    var id = G.dealer, st = D.studio;
    if (id === "designer") return [byId(st.cases, G.deco.case).name + " 케이스", byId(st.keyrings, G.deco.keyring).name, byId(st.backs, G.deco.back).name].filter(function (x) { return x !== "없음"; }).join(" · ");
    if (id === "quick") return byId(K.quickSpeed, G.quick.speed).name + " · " + byId(K.quickOpen, G.quick.open).name;
    if (id === "price") return byId(K.priceFocus, G.focus).name;
    if (id === "safe") return K.safeItems.filter(function (o) { return G.safe[o.id]; }).map(function (o) { return o.name; }).join(" + ") || "선택 안 함";
    if (id === "used") return byId(K.usedGrades, G.used.grade).name + " · 배터리 " + byId(K.usedBattery, G.used.bat).name;
    return "최저 조건 자동";
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
  function summaryRow() { var P2 = prod(), p = D.products[G.model]; return '<div class="pick-row">' + phoneIcon(p, p.colors[G.ci][1]) + '<span><b>' + esc(P2.name) + ' ' + G.sto + '</b><em>' + esc(p.colors[G.ci][0]) + ' · 출고가 ' + won(P2.list) + '</em></span></div>'; }

  /* ---------- 대본 (q = 미션 칸) ---------- */
  function say(t) { return t; }
  var STEPS = {
    model: { q: 0, t: function () { return "“" + D.dealers[G.dealer].quote + "” 어떤 폰?"; }, panel: "model" },
    spec: { q: 0, t: function () { return "<b>" + esc(prod().name) + "</b> 좋지! 색이랑 용량 골라."; }, panel: "spec", ch: function () { return [["이걸로", function () { go("point"); }, "go"], ["다른 폰", function () { go("model"); }]]; } },
    point: { q: 1, t: function () { return D.dealers[G.dealer].pitch; }, panel: "point", ch: function () {
      if (G.dealer === "allinone") return [["🙌 알아서 해 줘", function () { G.auto = true; G.cur = "mvno"; G.bundle = "free"; G.tier = "mid"; G.months = 24; G.method = null; G.con = null; go("calc"); }, "go"], ["내가 고를래", function () { G.auto = false; go("cur"); }]];
      return [["좋아, 다음", function () { go(G.dealer === "used" ? "data" : "cur"); }, "go"]];
    } },
    cur: { q: 2, t: function () { return "지금 쓰는 <b>통신사</b>는?"; }, panel: "cur", grid: true, ch: function () {
      return K.curs.map(function (c) { return [c[1], function () { G.cur = c[0]; go(byId(K.carriers, c[0]) ? "bundle" : "data"); }]; });
    } },
    bundle: { q: 2, t: function () { return "<b>가족·인터넷 결합</b> 있어?"; }, panel: "bundle", ch: function () {
      return [["있어 · 유지", function () { G.bundle = "keep"; go("data"); }], ["없어 · 최저가", function () { G.bundle = "free"; go("data"); }, "go"]];
    } },
    data: { q: 2, t: function () { return G.dealer === "used" ? "중고폰엔 알뜰 요금이 잘 맞아. 데이터는 얼마나 써?" : "데이터는 한 달에 얼마나 써?"; }, panel: "data" },
    calc: { q: 3, t: function () { return "잠깐만, 다 계산해 볼게…"; }, panel: "calc", auto: 1300, next: "quote" },
    quote: { q: 3, t: function () {
      var L = methods(); if (G.auto) { G.method = L[0].id; G.con = L[0].best || null; }
      return G.auto ? "제일 싼 건 <b>" + esc(L[0].title) + "</b>. 이걸로 맞춰 놨어." : "<b>" + esc(L[0].title) + "</b>이(가) 제일 싸. 다른 줄도 눌러 봐.";
    }, panel: "quote", ch: function () { return [[G.auto ? "이대로 할게" : "이 방법으로", function () { if (!G.method) G.method = methods()[0].id; go(G.auto ? "join" : "cond"); }, "go"]]; } },
    cond: { q: 3, t: function () { return curMethod().kind === "carrier" ? "할인은 <b>둘 중 하나</b>. 더 싼 쪽에 표시해 놨어." : "약정 없어. 폰값 낼 방법만 골라."; }, panel: "cond", ch: function () { return [["좋아", function () { go(G.member ? "agree" : "join"); }, "go"], ["견적 다시", function () { go("quote"); }]]; } },
    join: { q: 4, t: function () { return "<b>1mm 멤버십</b> 가입하면 지금 " + man(K.memberDc) + " 더 빠져. 3초!"; }, panel: "join", ch: function () { return [["다음에", function () { go("agree"); }]]; } },
    joined: { q: 4, t: function () { return "가입 완료! " + man(K.memberDc) + " 빠졌어."; }, panel: "join", auto: 1200, next: "agree" },
    agree: { q: 4, t: function () { return "<b>개봉·개통하면</b> 단순 변심 반품은 안 돼. 불량은 7일 안에 교환. 도장 찍고 서명!"; }, panel: "agree", ch: function () { return [["서명 완료", signDone, "go"]]; } },
    ship: { q: 5, t: function () { return "어디로 보낼까?"; }, panel: "ship", ch: function () { return [["주문 내역 확인", function () { if (formOk()) go("review"); else repaint(); }, "go"]]; } },
    review: { q: 5, t: function () { return "<b>주문 내역</b> 확인하고 결제!"; }, panel: "review", ch: function () {
      return [["✏️ 수정", function () { go("ship"); }], ["💳 결제하기", function () { var d = new Date(); G.no = "PP-" + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "-" + (1000 + Math.floor(Math.random() * 9000)); go("done"); }, "go"]];
    } },
    done: { q: 6, t: function () { return "고마워, " + esc(G.f.name) + "! " + (G.ship === "quick" ? "오늘 퀵으로 보낼게." : "잘 챙겨 보낼게.") + " 영수증 받아 가."; }, panel: "done", ch: function () { return [["광장으로", function () { close(); }, "go"], ["처음부터", function () { open(G.dealer); }]]; } },
  };
  function signDone() {
    var need = K.agree.filter(function (a) { return a.id !== "a2" || curMethod().kind === "carrier"; });
    G.err = {}; need.forEach(function (a) { if (!G.agree[a.id]) G.err[a.id] = 1; }); if (!G.signed) G.err.sign = 1;
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
    CUR = id; G.err = id === "agree" || id === "ship" ? G.err : {};
    var st = STEPS[id];
    renderMission(st.q);
    $("#shopBack").hidden = !HIST.length || id === "done";
    var panel = $("#shopPanel");
    if (st.panel) { panel.hidden = false; panel.innerHTML = P[st.panel](); panel.scrollTop = 0; if (st.panel === "agree") initSign(); }
    else panel.hidden = true;
    $("#shopCh").innerHTML = ""; $("#shopCh").className = "sch" + (st.grid ? " grid" : "");
    type(st.t());
    if (st.auto) timers.push(setTimeout(function () { go(st.next); }, st.auto));
    if (opts.onStep) opts.onStep(id);
  }
  function back() { var p = HIST.pop(); if (p) go(p, true); }
  function repaint() { var st = STEPS[CUR], el = $("#shopPanel"), y = el.scrollTop; if (st.panel) { el.innerHTML = P[st.panel](); el.scrollTop = y; if (st.panel === "agree") initSign(); } }
  var full = "";
  function type(html) {
    var p = $("#shopTxt"); full = html; var plain = html.replace(/<[^>]+>/g, ""), i = 0;
    if (typing) clearInterval(typing);
    if (opts.onTalk) opts.onTalk(true);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    p.textContent = "";
    typing = setInterval(function () { i += 2; p.textContent = plain.slice(0, i); if (i >= plain.length) finish(); }, 22);
  }
  function finish() {
    if (typing) clearInterval(typing); typing = null; $("#shopTxt").innerHTML = full;
    if (opts.onTalk) opts.onTalk(false);
    var st = STEPS[CUR], ch = $("#shopCh");
    if (st.ch && !ch.children.length) st.ch().forEach(function (c) {
      var b = document.createElement("button"); b.className = "say" + (c[2] ? " go" : ""); b.textContent = c[0]; b.onclick = c[1]; ch.appendChild(b);
    });
  }
  function renderMission(q) {
    var ol = $("#mission"); ol.innerHTML = "";
    MISSION(G.dealer).forEach(function (m, i) {
      var skip = (i === 2 && (G.auto || false));
      var li = document.createElement("li"); li.className = (i < q ? "on" : "") + (i === q ? " now" : "") + (skip && q > 2 ? " skip" : "");
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

  // 테이블 위 물건 누르기
  function onPanel(e) {
    var b = e.target.closest("[data-act]"); if (!b) return;
    var a = b.dataset.act, v = b.dataset.v;
    if (a === "model") { G.model = v; G.ci = 0; G.sto = "256GB"; go("spec"); return; }
    if (a === "ci") G.ci = +v;
    if (a === "sto") G.sto = v;
    if (a === "deco") { G.deco[b.dataset.k] = v; if (opts.onDeco) opts.onDeco(G); }
    if (a === "studio") { if (opts.openStudio) opts.openStudio(G); return; }
    if (a === "qs") G.quick.speed = v;
    if (a === "qo") G.quick.open = v;
    if (a === "focus") G.focus = v;
    if (a === "safe") G.safe[v] = !G.safe[v];
    if (a === "stamp") G.stamps[v] = !G.stamps[v];
    if (a === "grade") G.used.grade = v;
    if (a === "bat") G.used.bat = v;
    if (a === "tier") { G.tier = v; go("calc"); return; }
    if (a === "method") { G.method = v; G.con = null; }
    if (a === "con") G.con = v;
    if (a === "months") G.months = +v;
    if (a === "join") { G.member = true; toast("🎉 -" + man(K.memberDc) + " 멤버십 등록!"); go("joined"); return; }
    if (a === "agree") { G.agree[v] = !G.agree[v]; delete G.err[v]; }
    if (a === "ship") G.ship = v;
    repaint();
  }

  function open(dealer) {
    G = fresh(dealer); HIST = []; CUR = null;
    var d = D.dealers[dealer], sec = $("#shop");
    sec.hidden = false; sec.style.setProperty("--c", d.color); sec.dataset.dealer = dealer;
    $("#shopWho").textContent = d.name;
    document.documentElement.classList.add("shopping");
    go("model");
  }
  function close() {
    timers.forEach(clearTimeout); if (typing) clearInterval(typing); typing = null;
    $("#shop").hidden = true; document.documentElement.classList.remove("shopping");
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
    methods: function () { return methods(); }, quote: function () { return quoteNow(); },
  };
})();
