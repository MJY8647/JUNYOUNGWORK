import './style.css';
import { PRODUCTS } from './products.js';
import { STORE, PLANS, JOIN_TYPES, SUPPORT_TYPES, MONTHS } from './config.js';
import { quote, retailPrice, won } from './pricing.js';
import { cart } from './cart.js';

const app = document.getElementById('app');
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const sellable = PRODUCTS.filter((p) => p.status !== 'upcoming');
const upcoming = PRODUCTS.filter((p) => p.status === 'upcoming');
const best = sellable.filter((p) => p.best).sort((a, b) => a.best - b.best);
const pct = (p) => Math.round((1 - p.dealPrice / p.listPrice) * 100);
const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
let cleanup = null;

// ---------- 공통 ----------
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2600);
}

function cartCount() { return cart.items().length; }

function shell(content, active) {
  const n = cartCount();
  const nav = [['#/', '홈', 'home'], ['#/products', '휴대폰', 'products'], ['#/cart', '장바구니', 'cart'], ['#/login', '로그인', 'login']];
  return `
  <header class="hdr">
    <a class="logo" href="#/"><span class="logo-mark" aria-hidden="true"></span>${STORE.name}</a>
    <nav class="hdr-nav" aria-label="주 메뉴">
      ${nav.map(([h, l, k]) => `<a href="${h}" ${k === active ? 'aria-current="page"' : ''}>${l}${k === 'cart' && n ? `<span class="badge">${n}</span>` : ''}</a>`).join('')}
    </nav>
  </header>
  <main id="main">${content}</main>
  <footer class="ftr">
    <p><b>${STORE.name}</b> · 상담 ${STORE.phone} · ${STORE.hours}</p>
    <p>프로토타입입니다. 실제 주문·결제·개통이 진행되지 않습니다. 가격은 2026-11-19 수집 표시값과 KT 공식 요금표(2026-05) 기준 예상치이며, 실제 지원금·재고와 다를 수 있습니다.</p>
    <p>사업자 정보: ${STORE.business ?? '운영 전 등록 필요'}</p>
  </footer>
  <nav class="tabbar" aria-label="하단 메뉴">
    ${nav.map(([h, l, k]) => `<a href="${h}" ${k === active ? 'aria-current="page"' : ''}><span class="ti ti-${k}" aria-hidden="true"></span>${l}${k === 'cart' && n ? `<span class="badge">${n}</span>` : ''}</a>`).join('')}
  </nav>`;
}

function card(p) {
  if (p.status === 'upcoming') {
    return `<a class="pcard upcoming" href="#/products/${p.id}">
      <div class="pcard-img"><span class="soon">출시 예정</span></div>
      <h3>${p.name}</h3><p class="muted">가격 미정</p></a>`;
  }
  return `<a class="pcard ${p.status === 'soldout' ? 'soldout' : ''}" href="#/products/${p.id}">
    <div class="pcard-img" style="--tone:${p.tone}">
      <img src="${asset(p.image)}" alt="" loading="lazy" width="320" height="320">
      ${p.best ? `<span class="rank">BEST ${p.best}</span>` : ''}
      ${p.status === 'soldout' ? '<span class="so">품절</span>' : ''}
    </div>
    <h3>${p.name}</h3>
    <p class="caps">${p.storages.join(' · ')}</p>
    <p class="orig">${won(p.listPrice)}</p>
    <p class="deal"><span class="pct">${pct(p)}%</span>${won(p.dealPrice)}</p>
  </a>`;
}

// ---------- 홈: 걸어서 둘러보는 쇼핑 마을 ----------
// 가게 간판 이름이 곧 가게 이름. soon: 준비 중인 가게 (상품 없음)
const SOON = { name: 'COMING SOON', greeting: '곧 문을 열어요! 조금만 기다려 주세요.', soon: true, items: () => [] };
const SHOPS = [
  { id: 'samsung', name: 'SAMSUNG', color: '#3d7be0', wall: '#eaf2ff', screen: '#a9c8ff', greeting: '어서 오세요! 갤럭시 신제품 구경하고 가세요.', items: () => sellable.filter((p) => p.brand === 'samsung') },
  { id: 'apple', name: 'Apple', color: '#5f6b7a', wall: '#f6f6f8', screen: '#ffd1e0', greeting: '아이폰 찾으세요? 안으로 들어오세요!', items: () => sellable.filter((p) => p.brand === 'apple') },
  { id: 'soon-1', color: '#ef9a2d', wall: '#fff3dc', screen: '#ffe08a', ...SOON },
  { id: 'soon-2', color: '#2fae8f', wall: '#e6f7f1', screen: '#9fe3cf', ...SOON },
  { id: 'soon-3', color: '#8f6fd8', wall: '#f1ebff', screen: '#d6c6ff', ...SOON },
];

function shopPanelHtml(s) {
  const body = s.soon
    ? '<p class="empty">준비 중인 가게예요. 곧 새로운 폰을 만나보실 수 있어요.</p>'
    : `<div class="grid">${s.items().map(card).join('')}</div>`;
  return `
    <div class="sp-head" style="--c:${s.color}">
      <div><h2 id="sp-title">${s.name}</h2><p>${s.greeting}</p></div>
      <button type="button" class="sp-close" aria-label="가게에서 나가기">나가기</button>
    </div>
    <div class="sp-body">${body}</div>`;
}

async function viewHome() {
  app.innerHTML = shell(`
    <section class="town">
      <canvas class="town-canvas" aria-label="작은 행성 위의 휴대폰 쇼핑 마을. 캐릭터를 움직여 가게에 들어가 보세요"></canvas>
      <div class="town-overlay"></div>
      <div class="town-top">
        <p class="town-help">드래그로 시점 돌리기 · 휠로 확대 · WASD 걷기 · Space 점프 · 땅을 클릭하면 이동</p>
        <div class="chips" role="list" aria-label="가게 바로 가기">
          ${SHOPS.filter((s) => !s.soon).map((s) => `<button type="button" role="listitem" class="chip" data-shop="${s.id}"><span class="dot" style="background:${s.color}"></span>${s.name}</button>`).join('')}
        </div>
      </div>
      <p class="zone-title" aria-live="polite"></p>
      <button type="button" class="enter-btn" hidden></button>
      <button type="button" class="jump-btn" aria-label="점프">점프</button>
      <div class="shop-panel" role="dialog" aria-modal="true" aria-labelledby="sp-title" hidden></div>
    </section>
    <section class="sec">
      <div class="sec-head"><h2>지금 많이 찾는 폰</h2><a href="#/products">전체 보기</a></div>
      <div class="grid">${best.map(card).join('')}</div>
    </section>`, 'home');

  const root = app.querySelector('.town');
  const enterBtn = root.querySelector('.enter-btn');
  const zoneEl = root.querySelector('.zone-title');
  const panel = root.querySelector('.shop-panel');
  let town = null, nearShop = null, lastFocus = null, zoneTimer = 0;

  function openShop(s) {
    lastFocus = document.activeElement;
    panel.innerHTML = shopPanelHtml(s);
    panel.hidden = false;
    enterBtn.hidden = true;
    town?.setInput(false);
    panel.querySelector('.sp-close').onclick = closeShop;
    panel.querySelector('h2').setAttribute('tabindex', '-1');
    panel.querySelector('h2').focus();
  }
  function closeShop() {
    panel.hidden = true;
    town?.setInput(true);
    enterBtn.hidden = !nearShop;
    (lastFocus && document.body.contains(lastFocus) ? lastFocus : root.querySelector('.town-canvas')).focus?.();
  }
  const onKey = (e) => {
    if (!panel.hidden) { if (e.key === 'Escape') closeShop(); return; }
    if ((e.key === 'e' || e.key === 'E' || (e.key === 'Enter' && e.target === document.body)) && nearShop) { e.preventDefault(); openShop(nearShop); }
  };
  addEventListener('keydown', onKey);
  enterBtn.onclick = () => nearShop && openShop(nearShop);

  const { createPlanet } = await import('./three/planet.js');
  if (!document.body.contains(root)) { removeEventListener('keydown', onKey); return; }
  town = createPlanet({
    canvas: root.querySelector('.town-canvas'),
    overlay: root.querySelector('.town-overlay'),
    shops: SHOPS,
    onNear(s) {
      nearShop = s;
      enterBtn.hidden = !s || !panel.hidden;
      if (s) enterBtn.innerHTML = `${s.name} 들어가기 <kbd>E</kbd>`;
    },
    onZone(s) {
      if (!s) return;
      zoneEl.textContent = s.name;
      zoneEl.style.setProperty('--c', s.color);
      zoneEl.classList.remove('show');
      void zoneEl.offsetWidth;
      zoneEl.classList.add('show');
      clearTimeout(zoneTimer);
      zoneTimer = setTimeout(() => zoneEl.classList.remove('show'), 2200);
    },
    onEnterShop: openShop,
  });
  root.querySelectorAll('[data-shop]').forEach((b) => { b.onclick = () => town.walkTo(b.dataset.shop); });
  root.querySelector('.jump-btn').onclick = () => town.jump();
  cleanup = () => { clearTimeout(zoneTimer); removeEventListener('keydown', onKey); town.dispose(); };
}

// ---------- 목록 ----------
const TABS = [['all', '전체'], ['samsung', '삼성'], ['apple', '애플'], ['budget', '실속폰'], ['etc', '기타']];
const SORTS = [['new', '신상품순'], ['popular', '인기순'], ['low', '낮은 가격순'], ['high', '높은 가격순']];

function viewProducts(params) {
  const tab = params.get('brand') ?? 'all';
  const sort = params.get('sort') ?? 'new';
  let list = sellable.filter((p) => tab === 'all' || (tab === 'budget' ? p.tier === 'budget' : p.brand === tab));
  const sorters = {
    new: (a, b) => (b.release ?? '').localeCompare(a.release ?? ''),
    popular: (a, b) => (a.best ?? 99) - (b.best ?? 99),
    low: (a, b) => a.dealPrice - b.dealPrice,
    high: (a, b) => b.dealPrice - a.dealPrice,
  };
  list = [...list].sort(sorters[sort]);
  const soon = upcoming.filter((p) => tab === 'all' || p.brand === tab);
  const q = (k, v) => { const n = new URLSearchParams(params); n.set(k, v); return `#/products?${n}`; };
  app.innerHTML = shell(`
    <section class="sec">
      <h1 class="page-title">휴대폰</h1>
      <div class="tabs" role="tablist">
        ${TABS.map(([k, l]) => `<a role="tab" href="${q('brand', k)}" aria-selected="${k === tab}">${l}</a>`).join('')}
      </div>
      <div class="bar">
        <span><b>${list.length}</b>건</span>
        <label class="sort">정렬
          <select id="sort">${SORTS.map(([k, l]) => `<option value="${k}" ${k === sort ? 'selected' : ''}>${l}</option>`).join('')}</select>
        </label>
      </div>
      ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : '<p class="empty">선택하신 조건에 맞는 상품이 없어요.</p>'}
      ${soon.length ? `<h2 class="sub">출시 예정</h2><div class="grid">${soon.map(card).join('')}</div>` : ''}
    </section>`, 'products');
  document.getElementById('sort').onchange = (e) => { location.hash = q('sort', e.target.value); };
}

// ---------- 상세 ----------
function viewDetail(id) {
  const p = byId(id);
  if (!p) return viewNotFound();
  if (p.status === 'upcoming') {
    app.innerHTML = shell(`<section class="sec narrow center">
      <p class="soon big">출시 예정</p><h1 class="page-title">${p.name}</h1>
      <p class="muted">출고가와 지원금이 정해지면 안내해 드릴게요.</p>
      <button class="btn" type="button" id="notify">출시 알림 받기</button>
      <p><a href="#/products">다른 폰 보기</a></p></section>`, 'products');
    document.getElementById('notify').onclick = () => toast('프로토타입이라 알림 신청은 아직 저장되지 않아요.');
    return;
  }
  const colors = p.colors ?? [{ name: '대표 색상', hex: p.tone }];
  const s = { storageIdx: 0, color: 0, joinType: 'change', supportType: 'device', planId: 'choice-basic', months: 24 };
  const soldout = p.status === 'soldout';

  const opt = (name, items, cur, labelFn, disabledFn = () => false) => `
    <div class="opts" role="radiogroup" aria-label="${name}">
      ${items.map((it, i) => {
        const v = it.id ?? i;
        const dis = soldout || disabledFn(it, i);
        return `<button type="button" role="radio" class="opt" data-k="${name}" data-v="${v}" aria-checked="${v === cur}" ${dis ? 'disabled' : ''}>${labelFn(it, i)}</button>`;
      }).join('')}
    </div>`;

  function render() {
    const plan = PLANS.find((x) => x.id === s.planId);
    const qt = quote({ product: p, storageIdx: s.storageIdx, supportType: s.supportType, plan, months: s.months });
    const info = document.getElementById('pdp-info');
    info.innerHTML = `
      <nav class="crumb"><a href="#/">홈</a> › <a href="#/products">휴대폰</a></nav>
      <h1>${p.name}</h1>
      <p class="orig">${won(p.listPrice)}</p>
      <p class="deal big"><span class="pct">${pct(p)}%</span>${won(p.dealPrice)}~</p>
      ${soldout ? '<p class="warn">현재 품절된 상품이에요.</p>' : ''}

      <h2 class="opt-title">색상 <span class="muted">${colors[s.color].name}</span></h2>
      <div class="opts swatches" role="radiogroup" aria-label="색상">
        ${colors.map((c, i) => `<button type="button" role="radio" class="sw" data-k="color" data-v="${i}" aria-checked="${i === s.color}" aria-label="${c.name}" style="--c:${c.hex}"></button>`).join('')}
      </div>
      ${p.colors ? '' : '<p class="note">색상 옵션 데이터가 없어 대표 색상만 보여드려요.</p>'}

      <h2 class="opt-title">용량</h2>
      ${opt('storageIdx', p.storages, s.storageIdx, (st, i) => {
        const r = retailPrice(p, i);
        return `${st}<small>${r ? won(r) : '가격 문의'}</small>`;
      }, (_, i) => retailPrice(p, i) == null)}

      <h2 class="opt-title">가입 유형</h2>
      ${opt('joinType', JOIN_TYPES, s.joinType, (j) => `${j.label}<small>${j.desc}</small>`)}

      <h2 class="opt-title">할인 방법</h2>
      ${opt('supportType', SUPPORT_TYPES, s.supportType, (j) => `${j.label}<small>${j.desc}</small>`)}

      <h2 class="opt-title">요금제</h2>
      ${opt('planId', PLANS, s.planId, (pl) => `${pl.name}<small>월 ${won(pl.fee)} · ${pl.data} · ${pl.roaming}</small>`)}

      <h2 class="opt-title">할부 기간</h2>
      ${opt('months', MONTHS.map((m) => ({ id: m })), s.months, (m) => (m.id ? `${m.id}개월` : '일시납'))}

      ${qt ? `
      <div class="summary" aria-live="polite">
        <h2>월 예상 금액</h2>
        <dl>
          <dt>출고가</dt><dd>${won(qt.retail)}</dd>
          <dt>기기값 할인</dt><dd>-${won(qt.deviceDiscount)}</dd>
          <dt>할부원금</dt><dd>${won(qt.principal)}</dd>
          ${qt.months ? `<dt>월 할부금 (${qt.months}개월, 연 5.9% 포함)</dt><dd>${won(qt.deviceMonthly)}</dd>` : `<dt>일시납 결제</dt><dd>${won(qt.upfront)}</dd>`}
          <dt>요금제 월정액</dt><dd>${won(qt.planFee)}</dd>
          ${qt.planDiscount ? `<dt>요금할인 25%</dt><dd>-${won(qt.planDiscount)}</dd>` : ''}
        </dl>
        <p class="total"><span>매달 내는 돈</span><b>${won(qt.totalMonthly)}</b></p>
        <p class="note">기기값 할인은 수집 당시 표시된 최대 할인액 기준 예상치예요. 실제 지원금은 요금제·가입유형·개통 시점에 따라 달라지고, 상담 후 확정돼요.</p>
      </div>` : '<p class="warn">선택한 옵션의 가격 정보가 없어요.</p>'}`;

    info.querySelectorAll('[data-k]').forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.k;
        s[k] = ['storageIdx', 'color', 'months'].includes(k) ? +b.dataset.v : b.dataset.v;
        if (k === 'color') viewer?.setColor(colors[s.color].hex);
        render();
        info.querySelector(`[data-k="${k}"][data-v="${b.dataset.v}"]`)?.focus();
      };
    });
    const bar = document.getElementById('buybar');
    bar.innerHTML = soldout
      ? `<div><span class="muted">품절</span></div><button type="button" class="btn" id="restock">재입고 알림</button>`
      : `<div><span class="muted">월 예상</span><b>${qt ? won(qt.totalMonthly) : '-'}</b></div><button type="button" class="btn" id="add" ${qt ? '' : 'disabled'}>장바구니 담기</button>`;
    document.getElementById('add')?.addEventListener('click', () => {
      cart.add({ productId: p.id, ...s, colorName: colors[s.color].name });
      toast('장바구니에 담았어요');
      updateBadges();
    });
    document.getElementById('restock')?.addEventListener('click', () => toast('프로토타입이라 알림 신청은 아직 저장되지 않아요.'));
  }

  app.innerHTML = shell(`
    <section class="pdp">
      <div class="pdp-media">
        <canvas class="pdp-canvas" aria-label="${p.name} 3D 미리보기. 좌우로 끌어 돌려보세요"></canvas>
        <img class="pdp-photo" src="${asset(p.image)}" alt="${p.name} 상품 사진" hidden>
        <div class="seg" role="tablist">
          <button type="button" role="tab" aria-selected="true" data-view="3d">3D</button>
          <button type="button" role="tab" aria-selected="false" data-view="photo">사진</button>
        </div>
        <p class="hint">좌우로 끌어서 돌려보세요</p>
      </div>
      <div class="pdp-info" id="pdp-info"></div>
    </section>
    <div class="buybar" id="buybar"></div>`, 'products');

  let viewer = null;
  render();
  const media = app.querySelector('.pdp-media');
  media.querySelectorAll('[data-view]').forEach((b) => {
    b.onclick = () => {
      const photo = b.dataset.view === 'photo';
      media.querySelectorAll('[data-view]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      media.querySelector('.pdp-photo').hidden = !photo;
      media.querySelector('.pdp-canvas').hidden = photo;
      media.querySelector('.hint').hidden = photo;
    };
  });
  import('./three/viewer.js').then(({ createViewer }) => {
    const canvas = app.querySelector('.pdp-canvas');
    if (!canvas) return;
    viewer = createViewer({ canvas, product: p, color: colors[s.color].hex });
    cleanup = () => viewer.dispose();
  });
}

// ---------- 장바구니 ----------
function lineQuote(it) {
  const p = byId(it.productId);
  const plan = PLANS.find((x) => x.id === it.planId);
  return p && { p, plan, q: quote({ product: p, storageIdx: it.storageIdx, supportType: it.supportType, plan, months: it.months }) };
}

function viewCart() {
  const items = cart.items().map((it) => ({ it, ...lineQuote(it) })).filter((x) => x.p && x.q);
  const total = items.reduce((a, x) => a + x.q.totalMonthly, 0);
  const label = (arr, id) => arr.find((x) => x.id === id)?.label;
  app.innerHTML = shell(`
    <section class="sec narrow">
      <h1 class="page-title">장바구니</h1>
      ${items.length ? `
      <ul class="lines">
        ${items.map(({ it, p, plan, q }) => `
          <li class="line">
            <img src="${asset(p.image)}" alt="" width="72" height="72">
            <div class="line-info">
              <h2><a href="#/products/${p.id}">${p.name}</a></h2>
              <p class="muted">${it.colorName} · ${p.storages[it.storageIdx]} · ${label(JOIN_TYPES, it.joinType)} · ${label(SUPPORT_TYPES, it.supportType)}</p>
              <p class="muted">${plan.name} · ${it.months ? `${it.months}개월 할부` : '일시납'}</p>
              <p class="line-price">월 ${won(q.totalMonthly)}${q.upfront ? ` <span class="muted">+ 일시납 ${won(q.upfront)}</span>` : ''}</p>
            </div>
            <button type="button" class="x" data-key="${it.key}" aria-label="${p.name} 삭제">삭제</button>
          </li>`).join('')}
      </ul>
      <p class="total"><span>월 예상 합계</span><b>${won(total)}</b></p>
      <a class="btn block" href="#/checkout">주문서 작성</a>` : `
      <p class="empty">장바구니가 비어 있어요.</p><a class="btn" href="#/products">휴대폰 보러 가기</a>`}
    </section>`, 'cart');
  app.querySelectorAll('.x').forEach((b) => { b.onclick = () => { cart.remove(b.dataset.key); viewCart(); }; });
}

// ---------- 주문서 · 로그인 (화면만) ----------
function demoForm(title, fields, submitLabel, active) {
  app.innerHTML = shell(`
    <section class="sec narrow">
      <h1 class="page-title">${title}</h1>
      <p class="demo-note">프로토타입 화면이에요. 입력한 정보는 전송·저장되지 않아요.</p>
      <form class="form" novalidate>
        ${fields}
        <button class="btn block" type="submit">${submitLabel}</button>
        <p class="form-msg" role="status" aria-live="polite"></p>
      </form>
    </section>`, active);
  const form = app.querySelector('form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const bad = [...form.querySelectorAll('[required]')].find((el) => (el.type === 'checkbox' ? !el.checked : !el.value.trim()));
    const msg = form.querySelector('.form-msg');
    if (bad) { msg.textContent = '필수 항목을 확인해 주세요.'; bad.focus(); return; }
    msg.textContent = '실제 접수 기능이 아직 연결되지 않아 주문·로그인이 진행되지 않았어요.';
  };
}

function viewCheckout() {
  if (!cartCount()) { location.hash = '#/cart'; return; }
  demoForm('주문서 작성', `
    <label>이름 <input name="name" autocomplete="name" required></label>
    <label>휴대폰 번호 <input name="tel" type="tel" inputmode="numeric" autocomplete="tel" required></label>
    <label>배송 주소 <input name="addr" autocomplete="street-address" required></label>
    <label class="check"><input type="checkbox" required> (필수) 개인정보 수집·이용에 동의합니다</label>`, '주문 신청', 'cart');
}

function viewLogin() {
  demoForm('로그인', `
    <label>아이디 <input name="id" autocomplete="username" required></label>
    <label>비밀번호 <input name="pw" type="password" autocomplete="current-password" required></label>`, '로그인', 'login');
}

function viewNotFound() {
  app.innerHTML = shell('<section class="sec narrow center"><h1 class="page-title">페이지를 찾을 수 없어요</h1><a class="btn" href="#/">홈으로</a></section>', '');
}

function updateBadges() {
  const n = cartCount();
  document.querySelectorAll('a[href="#/cart"]').forEach((a) => {
    a.querySelector('.badge')?.remove();
    if (n) a.insertAdjacentHTML('beforeend', `<span class="badge">${n}</span>`);
  });
}

// ---------- 라우터 ----------
function route() {
  // '#main' 같은 페이지 내 이동(본문 바로가기)은 화면 전환이 아님
  if (location.hash && !location.hash.startsWith('#/')) return;
  cleanup?.();
  cleanup = null;
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(qs);
  const parts = path.split('/').filter(Boolean);
  window.scrollTo(0, 0);
  if (!parts.length) viewHome();
  else if (parts[0] === 'products' && parts[1]) viewDetail(parts[1]);
  else if (parts[0] === 'products') viewProducts(params);
  else if (parts[0] === 'cart') viewCart();
  else if (parts[0] === 'checkout') viewCheckout();
  else if (parts[0] === 'login') viewLogin();
  else viewNotFound();
}

addEventListener('hashchange', route);
route();
