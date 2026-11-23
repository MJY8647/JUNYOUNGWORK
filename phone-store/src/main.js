import './style.css';
import { PRODUCTS } from './products.js';
import { STORE, PLANS, JOIN_TYPES, SUPPORT_TYPES, MONTHS, DEFAULT_PLAN, RECOMMENDED_PLANS, PLAN_GROUPS, planById, CHOICE_BENEFITS, AGE_BONUS, DELIVERY, GIFTS, CARDS, CONSULTS } from './config.js';
import { quote, retailPrice, won } from './pricing.js';
import { cart } from './cart.js';
import { account } from './account.js';
import { createPurchase } from './purchase.js';
import { audio } from './audio.js';

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
  const me = account.current();
  const nav = [['#/', '홈', 'home'], ['#/products', '휴대폰', 'products'], ['#/cart', '장바구니', 'cart'], me?.signupDone ? ['#/mypage', '마이', 'login'] : ['#/login', '로그인', 'login']];
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
const SOON = { name: 'COMING SOON', voice: 0.8, greeting: '곧 문을 열어요! 조금만 기다려 주세요.', soon: true, items: () => [] };
const SHOPS = [
  { id: 'samsung', name: 'SAMSUNG', color: '#3d7be0', wall: '#eaf2ff', screen: '#a9c8ff', voice: 0.95, greeting: '어서 오세요! 갤럭시 신제품 구경하고 가세요.', items: () => PRODUCTS.filter((p) => p.brand === 'samsung') },
  { id: 'apple', name: 'Apple', color: '#5f6b7a', wall: '#f6f6f8', screen: '#ffd1e0', voice: 1.2, greeting: '아이폰 찾으세요? 안으로 들어오세요!', items: () => PRODUCTS.filter((p) => p.brand === 'apple') },
  { id: 'soon-1', color: '#ef9a2d', wall: '#fff3dc', screen: '#ffe08a', ...SOON },
  { id: 'soon-2', color: '#2fae8f', wall: '#e6f7f1', screen: '#9fe3cf', ...SOON },
  { id: 'soon-3', color: '#8f6fd8', wall: '#f1ebff', screen: '#d6c6ff', ...SOON },
];

// 가게 안 시리즈 분류. match는 위에서부터 먼저 맞는 시리즈로 들어가고, 화면에는 order 순서로 보여준다.
const SERIES = {
  samsung: {
    order: ['fold', 'flip', 'ultra', 'basic'],
    list: [
      { id: 'fold', label: '폴드', match: (n) => n.includes('폴드') },
      { id: 'flip', label: '플립', match: (n) => n.includes('플립') },
      { id: 'ultra', label: '울트라', match: (n) => n.includes('울트라') },
      { id: 'basic', label: '일반', match: () => true },
    ],
  },
  apple: {
    order: ['duo', 'pro', 'basic', 'se-air'],
    list: [
      { id: 'duo', label: '듀오', match: (n) => n.includes('듀오') },
      { id: 'pro', label: '프로', match: (n) => n.includes('프로') },
      { id: 'se-air', label: 'SE · Air', match: (n) => n.includes('에어') || /\de$/.test(n) },
      { id: 'basic', label: '일반', match: () => true },
    ],
  },
};
// 최신순: 출시 예정 → 출시일 최근 순
const isSoon = (p) => (p.status === 'upcoming' ? 1 : 0);
const newestFirst = (a, b) => isSoon(b) - isSoon(a) || (b.release ?? '').localeCompare(a.release ?? '');
function seriesOf(shop) {
  const def = SERIES[shop.id];
  const groups = Object.fromEntries(def.list.map((c) => [c.id, []]));
  shop.items().forEach((p) => groups[def.list.find((c) => c.match(p.name)).id].push(p));
  return def.order.map((id) => ({ ...def.list.find((c) => c.id === id), items: groups[id].sort(newestFirst) }));
}

function shopPanelHtml(s, catId = null) {
  let body;
  if (s.soon) body = '<p class="empty">준비 중인 가게예요. 곧 새로운 폰을 만나보실 수 있어요.</p>';
  else if (!catId) {
    body = `<div class="cat-grid">${seriesOf(s).map((c) => {
      const cover = c.items.find((p) => p.image);
      const soonN = c.items.filter((p) => p.status === 'upcoming').length;
      return `<button type="button" class="cat-tile" data-cat="${c.id}" ${c.items.length ? '' : 'disabled'}>
        <span class="cat-img">${cover ? `<img src="${asset(cover.image)}" alt="" width="120" height="120">` : ''}</span>
        <span class="cat-name">${c.label}</span>
        <span class="cat-count">${c.items.length ? `${c.items.length}개 모델${soonN ? ` · 출시 예정 ${soonN}` : ''}` : '준비 중'}</span>
      </button>`;
    }).join('')}</div>`;
  } else {
    const c = seriesOf(s).find((x) => x.id === catId);
    body = `<div class="cat-bar"><button type="button" class="cat-back">← 시리즈 목록</button><h3 id="cat-title" tabindex="-1">${c.label} <span class="muted">${c.items.length}개 · 최신순</span></h3></div>
      <div class="grid">${c.items.map(card).join('')}</div>`;
  }
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
      <div class="sound-btns" role="group" aria-label="소리 설정">
        <button type="button" class="snd" id="snd-music" aria-pressed="${audio.prefs.music}">♪ 음악</button>
        <button type="button" class="snd" id="snd-sfx" aria-pressed="${audio.prefs.sfx}">효과음</button>
      </div>
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

  function showShop(s, catId = null) {
    panel.innerHTML = shopPanelHtml(s, catId);
    panel.scrollTop = 0;
    panel.querySelector('.sp-close').onclick = closeShop;
    panel.querySelectorAll('.cat-tile').forEach((b) => { b.onclick = () => { audio.sfx('click'); showShop(s, b.dataset.cat); }; });
    const back = panel.querySelector('.cat-back');
    if (back) back.onclick = () => { showShop(s); panel.querySelector(`.cat-tile[data-cat="${catId}"]`)?.focus(); };
    const focusEl = panel.querySelector('#cat-title') ?? panel.querySelector('h2');
    focusEl.setAttribute('tabindex', '-1');
    if (!back || catId) focusEl.focus();
  }
  function openShop(s) {
    audio.sfx('enter');
    lastFocus = document.activeElement;
    panel.hidden = false;
    enterBtn.hidden = true;
    town?.setInput(false);
    showShop(s);
  }
  function closeShop() {
    audio.sfx('close');
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
      audio.sfx('zone');
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
  const music = root.querySelector('#snd-music'), sfxBtn = root.querySelector('#snd-sfx');
  music.onclick = () => audio.setMusic(!audio.prefs.music);
  sfxBtn.onclick = () => audio.setSfx(!audio.prefs.sfx);
  const offAudio = audio.subscribe(() => { music.setAttribute('aria-pressed', audio.prefs.music); sfxBtn.setAttribute('aria-pressed', audio.prefs.sfx); });
  audio.playMusic();
  cleanup = () => { clearTimeout(zoneTimer); removeEventListener('keydown', onKey); offAudio(); audio.stopMusic(); town.dispose(); };
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

// 최종 주문서 지원금 행: 공시(공통)지원금 + 판매점 추가지원금
function subsidyRows(q) {
  if (q.subsidySource === 'table') return `
    <dt>공시지원금 (KT 공통지원금)</dt><dd>-${won(q.commonSubsidy)}</dd>
    <dt>판매점 추가지원금</dt><dd>-${won(q.extraSubsidy)}</dd>`;
  return `
    <dt>지원금 (예상)</dt><dd>-${won(q.deviceDiscount)}</dd>
    <dt class="sub">ㄴ 공시지원금 · 판매점 추가지원금</dt><dd class="sub">지원금표 입력 후 구분 표시</dd>`;
}

// ---------- 상세 (KT초이스 상세 구성: 옵션 → 요금제·혜택 → 할부·배송 → 사은품·제휴카드·상담 → 최종 주문서 → 상세정보·후기·유의사항) ----------
const RECENT = 'tps-recent-v1';
const recent = {
  get() { try { return JSON.parse(localStorage.getItem(RECENT)) ?? []; } catch { return []; } },
  push(id) { try { localStorage.setItem(RECENT, JSON.stringify([id, ...this.get().filter((x) => x !== id)].slice(0, 10))); } catch { /* 무시 */ } },
};
const NOTICES = [
  ['통신사 공식신청서 작성', '개통하려면 주문 접수 후 통신사 공식신청서를 명의자 본인 정보로 작성해야 해요.'],
  ['가입 유형', '다른 통신사에서 오시면 번호이동, 지금 KT를 쓰시면 기기변경을 선택해 주세요. 미성년자·외국인 명의는 법정대리인 동의나 추가 서류가 필요할 수 있어요.'],
  ['지원금', '지원금은 선택한 요금제·가입유형에 따라 달라지고, 통신사 정책에 따라 예고 없이 바뀔 수 있어요. 최종 지원금은 개통 시점에 확정돼요.'],
  ['요금제', '선택약정(요금할인 25%)은 약정 기간 안에 해지하면 할인반환금이 생길 수 있어요. 가입 후 요금제를 바꾸면 지원금·혜택 조건이 달라질 수 있어요.'],
  ['사은품', '사은품은 재고에 따라 같은 급의 상품으로 바뀔 수 있고, 개통 취소·반품 시 회수되거나 해당 금액이 청구될 수 있어요.'],
  ['결제·할부', '단말기 대금은 일시불 또는 최대 36개월 할부로 낼 수 있고, 할부 시 할부수수료(연 5.9%)가 붙어요. 신용 상태에 따라 할부 승인이 제한될 수 있어요.'],
  ['배송', '개통이 끝나면 선택한 방법으로 보내드려요. 도서·산간 지역은 1~2일 더 걸릴 수 있고, 미개봉 정품으로 배송돼요.'],
  ['취소·교환·환불', '개통 전 단순 변심은 받은 날부터 7일 안에 교환·반품할 수 있어요. 개통 후에는 통신사 정책과 관련 법령이 적용되고, 고객 부주의로 인한 파손은 교환·환불이 제한될 수 있어요.'],
];

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
  recent.push(p.id);
  const colors = p.colors ?? [{ name: '대표 색상', hex: p.tone }];
  const gifts = GIFTS.filter((g) => g.brand === 'all' || g.brand === p.brand);
  const s = { storageIdx: 0, color: 0, joinType: 'change', supportType: 'device', planId: DEFAULT_PLAN, benefit: CHOICE_BENEFITS[0].id, months: 24, delivery: 'parcel', cardId: '', consults: [] };
  const soldout = p.status === 'soldout';
  let tab = 'info';

  const opt = (name, items, cur, labelFn, disabledFn = () => false) => `
    <div class="opts" role="radiogroup" aria-label="${name}">
      ${items.map((it, i) => {
        const v = it.id ?? i;
        const dis = soldout || disabledFn(it, i);
        return `<button type="button" role="radio" class="opt" data-k="${name}" data-v="${v}" aria-checked="${v === cur}" ${dis ? 'disabled' : ''}>${labelFn(it, i)}</button>`;
      }).join('')}
    </div>`;
  const planLabel = (pl) => `${pl.name}<small>월 ${won(pl.fee)} · ${pl.data}${pl.roaming ? ` · ${pl.roaming}` : ''}</small>`;

  function render() {
    const plan = planById(s.planId);
    const card = CARDS.find((c) => c.id === s.cardId) ?? null;
    const qt = quote({ product: p, storageIdx: s.storageIdx, supportType: s.supportType, plan, months: s.months, card, joinType: s.joinType });
    const shownPlans = [...new Set([...RECOMMENDED_PLANS, s.planId])].map(planById);
    const recents = recent.get().filter((x) => x !== p.id).map(byId).filter((x) => x && x.status !== 'upcoming').slice(0, 6);
    const benefit = CHOICE_BENEFITS.find((b) => b.id === s.benefit);
    const info = document.getElementById('pdp-info');
    info.innerHTML = `
      <nav class="crumb"><a href="#/">홈</a> › <a href="#/products">휴대폰</a></nav>
      <h1>${p.name}</h1>
      <p class="orig">${won(p.listPrice)}</p>
      <p class="deal big"><span class="pct">${pct(p)}%</span>${won(p.dealPrice)}~</p>
      <div class="pdp-tags"><span>할부원금 최대 ${won(qt?.deviceDiscountTotal ?? 0)} 할인</span><span>${STORE.sameDay}</span></div>
      ${soldout ? '<p class="warn">현재 품절된 상품이에요.</p>' : ''}

      <h2 class="opt-title">색상 <span class="muted">${colors[s.color].name}</span></h2>
      <div class="opts swatches" role="radiogroup" aria-label="색상">
        ${colors.map((c, i) => `<button type="button" role="radio" class="sw" data-k="color" data-v="${i}" aria-checked="${i === s.color}" aria-label="${c.name}" style="--c:${c.hex}"></button>`).join('')}
      </div>
      ${p.colors ? '' : '<p class="note">색상 옵션 데이터가 없어 대표 색상만 보여드려요.</p>'}

      <h2 class="opt-title">용량</h2>
      ${opt('storageIdx', p.storages, s.storageIdx, (st, i) => { const r = retailPrice(p, i); return `${st}<small>${r ? `${won(r)}${p.storageEstimated && i ? ' (예상)' : ''}` : '상담 후 안내'}</small>`; }, (_, i) => retailPrice(p, i) == null)}
      ${p.storages.some((_, i) => retailPrice(p, i) == null) ? `<p class="note">'상담 후 안내' 용량은 KT 출고가를 아직 받지 못해 온라인으로 바로 주문할 수 없어요. 상담으로 가격을 안내해 드려요. (${STORE.phone})</p>` : ''}
      ${p.storageEstimated ? '<p class="note">(예상) 가격은 애플 공식몰 용량별 가격 차이로 계산한 예상 출고가예요. 개통 시 KT 출고가로 확정돼요.</p>' : ''}

      <h2 class="opt-title">가입 유형</h2>
      ${opt('joinType', JOIN_TYPES, s.joinType, (j) => `${j.label}<small>${j.desc}</small>`)}

      <h2 class="opt-title">할인 방법</h2>
      ${opt('supportType', SUPPORT_TYPES, s.supportType, (j) => `${j.label}<small>${j.id === 'device' ? `기기값 총 ${won(qt?.deviceDiscountTotal ?? 0)} 할인` : `24개월 총 ${won(qt?.planDiscountTotal24 ?? 0)} 할인`}</small>`)}

      <h2 class="opt-title">요금제 <span class="muted">추천</span></h2>
      ${opt('planId', shownPlans, s.planId, planLabel)}
      <button type="button" class="btn ghost block" id="more-plans" ${soldout ? 'disabled' : ''}>다른 요금제 선택 <small class="muted">${PLANS.length}개</small></button>
      <p class="note">${AGE_BONUS}</p>

      ${plan.choice ? `<h2 class="opt-title">요금제 특별 혜택 <span class="muted">택1</span></h2>
      ${opt('benefit', CHOICE_BENEFITS, s.benefit, (b) => `${b.label}<small>${b.desc}</small>`)}` : ''}

      <h2 class="opt-title">할부 기간</h2>
      ${opt('months', MONTHS.map((m) => ({ id: m })), s.months, (m) => (m.id ? `${m.id}개월${m.id === 24 ? ' <small>추천</small>' : ''}` : '일시납'))}

      <h2 class="opt-title">배송 방법</h2>
      ${opt('delivery', DELIVERY, s.delivery, (d) => `${d.label}<small>${d.desc}</small>`)}

      <h2 class="opt-title">${STORE.name} 기본 사은품 <span class="muted">100% 증정</span></h2>
      <ul class="gifts">${gifts.map((g) => `<li><img src="${asset(g.image)}" alt="" width="64" height="64"><div><b>${g.label}</b><small>${g.desc}</small></div></li>`).join('')}</ul>

      <h2 class="opt-title">추가 할인</h2>
      <label class="card-pick">이용 중인 KT 제휴카드로 할인받기
        <select id="card" ${soldout ? 'disabled' : ''}><option value="">선택 안 함</option>${CARDS.map((c) => `<option value="${c.id}" ${c.id === s.cardId ? 'selected' : ''}>${c.name} · 월 최대 ${won(c.max)}</option>`).join('')}</select>
      </label>
      <p class="note">전월 실적 조건을 채웠을 때 받는 최대 청구할인이에요. 조건은 카드사마다 달라요.</p>

      <h2 class="opt-title">추가 상담이 필요하면 체크해 주세요 <span class="muted">여러 개 가능</span></h2>
      <div class="opts">${CONSULTS.map((c) => `<button type="button" class="opt" role="checkbox" data-consult="${c.id}" aria-checked="${s.consults.includes(c.id)}">${c.label}<small>${c.desc}</small></button>`).join('')}</div>

      ${qt ? `
      <div class="summary" aria-live="polite">
        <h2>최종 주문서</h2>
        <p class="sum-item"><b>${p.name}</b> · ${colors[s.color].name} · ${p.storages[s.storageIdx]} · ${JOIN_TYPES.find((j) => j.id === s.joinType).label}<br><span class="muted">${plan.name}${plan.choice ? ` (${benefit.label})` : ''} · ${s.months ? `${s.months}개월 할부` : '일시납'} · ${DELIVERY.find((d) => d.id === s.delivery).label}</span></p>
        <dl>
          <dt>출고가</dt><dd>${won(qt.retail)}</dd>
          ${subsidyRows(qt)}
          <dt>할부원금</dt><dd>${won(qt.principal)}</dd>
          ${qt.months ? `<dt>월 할부금 (${qt.months}개월, 할부이자 포함)</dt><dd>${won(qt.deviceMonthly)}</dd><dt class="sub">ㄴ 할부이자</dt><dd class="sub">연 5.9%</dd>` : `<dt>일시납 결제</dt><dd>${won(qt.upfront)}</dd>`}
          <dt>요금제 월정액</dt><dd>${won(qt.planFee)}</dd>
          ${qt.planDiscount ? `<dt>요금할인 25%</dt><dd>-${won(qt.planDiscount)}</dd>` : ''}
          <dt>월 통신요금</dt><dd>${won(qt.planMonthly)}</dd>
          ${card ? `<dt>제휴카드 할인 (실적 충족 시)</dt><dd>-${won(qt.cardDiscount)}</dd>` : ''}
        </dl>
        <p class="total"><span>월 예상 금액</span><b>${won(qt.totalMonthly)}</b></p>
        <p class="note">부가세 포함 · ${qt.subsidySource === 'table' ? `지원금은 ${qt.subsidyDate} 공시 기준이에요.` : '지원금표가 입력되지 않은 상품이라 수집 당시 표시된 최대 할인액을 예상 지원금으로 보여드려요.'} 최종 지원금은 개통 시점에 확정돼요.</p>
        <p class="sum-gifts">함께 받는 혜택: ${gifts.map((g) => g.label).join(' · ')}</p>
      </div>` : '<p class="warn">선택한 옵션의 가격 정보가 없어요.</p>'}`;

    info.querySelectorAll('[data-k]').forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.k;
        s[k] = ['storageIdx', 'color', 'months'].includes(k) ? +b.dataset.v : b.dataset.v;
        if (k === 'color') viewer?.setColor(colors[s.color].hex);
        audio.sfx('click');
        render();
        info.querySelector(`[data-k="${k}"][data-v="${b.dataset.v}"]`)?.focus();
      };
    });
    info.querySelectorAll('[data-consult]').forEach((b) => {
      b.onclick = () => {
        const c = b.dataset.consult;
        s.consults = s.consults.includes(c) ? s.consults.filter((x) => x !== c) : [...s.consults, c];
        audio.sfx('click'); render();
        info.querySelector(`[data-consult="${c}"]`)?.focus();
      };
    });
    info.querySelector('#card').onchange = (e) => { s.cardId = e.target.value; render(); info.querySelector('#card').focus(); };
    info.querySelector('#more-plans').onclick = openPlanPicker;

    // 상세정보 · 구매후기 · 유의사항
    const tabsEl = document.getElementById('pdp-tabs');
    const tabs = [['info', '상세정보'], ['review', '구매후기'], ['notice', '유의사항']];
    tabsEl.innerHTML = `
      <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${k === tab}">${l}</button>`).join('')}</div>
      <div class="tab-body">${tab === 'info' ? `
        <dl class="kv spec">
          <dt>제조사</dt><dd>${p.brand === 'samsung' ? '삼성전자' : p.brand === 'apple' ? 'Apple' : '기타'}</dd>
          <dt>출시일</dt><dd>${p.release ? `${p.release.slice(0, 4)}.${p.release.slice(4, 6)}.${p.release.slice(6)}` : '-'}</dd>
          <dt>용량</dt><dd>${p.storages.join(' · ')}</dd>
          <dt>색상</dt><dd>${colors.map((c) => c.name).join(' · ')}</dd>
          <dt>출고가</dt><dd>${won(p.listPrice)}</dd>
          <dt>통신사</dt><dd>KT</dd>
          <dt>기본 사은품</dt><dd>${gifts.map((g) => g.label).join(', ')}</dd>
        </dl>
        <img class="detail-photo" src="${asset(p.image)}" alt="${p.name} 상품 사진" loading="lazy">`
      : tab === 'review' ? `<p class="empty">아직 등록된 구매후기가 없어요. 개통을 마친 고객만 후기를 남길 수 있어요.</p>`
      : `<div class="notices">${NOTICES.map(([t, d]) => `<details><summary>${t}</summary><p>${d}</p></details>`).join('')}</div>`}</div>
      ${recents.length ? `<h2 class="sub">최근 본 상품</h2><div class="recent">${recents.map((r) => `<a href="#/products/${r.id}"><img src="${asset(r.image)}" alt="" width="72" height="72"><span>${r.name}</span><b>${won(r.dealPrice)}</b></a>`).join('')}</div>` : ''}`;
    tabsEl.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; render(); tabsEl.querySelector(`[data-tab="${tab}"]`).focus(); }; });

    const bar = document.getElementById('buybar');
    bar.innerHTML = soldout
      ? `<div><span class="muted">품절</span></div><button type="button" class="btn" id="restock">재입고 알림</button>`
      : `<div><span class="muted">월 예상</span><b>${qt ? won(qt.totalMonthly) : '-'}</b></div>
         <div class="buy-btns"><button type="button" class="btn ghost" id="add" ${qt ? '' : 'disabled'}>장바구니</button><button type="button" class="btn" id="buy" ${qt ? '' : 'disabled'}>바로 구매</button></div>`;
    const item = () => ({ productId: p.id, ...s, colorName: colors[s.color].name });
    document.getElementById('add')?.addEventListener('click', () => { cart.add(item()); audio.sfx('pop'); toast('장바구니에 담았어요'); updateBadges(); });
    document.getElementById('buy')?.addEventListener('click', () => purchase.startBuy(item()));
    document.getElementById('restock')?.addEventListener('click', () => toast('프로토타입이라 알림 신청은 아직 저장되지 않아요.'));
  }

  // "다른 요금제 선택" 팝업: 분류 탭 + 요금제 목록
  function openPlanPicker() {
    const back = document.activeElement;
    let group = planById(s.planId).group;
    const m = document.createElement('div');
    m.className = 'modal';
    const draw = () => {
      const list = PLANS.filter((pl) => pl.group === group);
      const g = PLAN_GROUPS.find((x) => x.id === group);
      m.innerHTML = `
        <div class="modal-box plan-pop" role="dialog" aria-modal="true" aria-labelledby="pp-title">
          <div class="pp-head"><h2 id="pp-title">요금제 선택</h2><button type="button" class="sp-close dark" data-close aria-label="닫기">닫기</button></div>
          <div class="tabs pp-tabs" role="tablist">${PLAN_GROUPS.map((x) => `<button type="button" role="tab" data-g="${x.id}" aria-selected="${x.id === group}">${x.label}</button>`).join('')}</div>
          <p class="note">${g.desc}</p>
          <ul class="pp-list">${list.map((pl) => `
            <li><button type="button" class="pp-item" data-plan="${pl.id}" aria-pressed="${pl.id === s.planId}">
              <span class="pp-name">${pl.name}${RECOMMENDED_PLANS.includes(pl.id) ? '<em>추천</em>' : ''}</span>
              <span class="pp-fee">월 ${won(pl.fee)}<small>요금할인 25% 시 ${won(pl.fee - Math.round(pl.fee * 0.25))}</small></span>
              <span class="pp-desc">${[pl.data, pl.share, pl.roaming, pl.membership && `멤버십 ${pl.membership}`, pl.choice && '혜택 택1'].filter(Boolean).join(' · ')}</span>
            </button></li>`).join('')}</ul>
          <p class="note">KT 통합요금제 · 부가세 포함 · KT 공식 상품 페이지(2026년 7월·11월 게시) 기준</p>
        </div>`;
      m.querySelector('[data-close]').onclick = close;
      m.querySelectorAll('[data-g]').forEach((b) => { b.onclick = () => { group = b.dataset.g; audio.sfx('click'); draw(); m.querySelector(`[data-g="${group}"]`).focus(); }; });
      m.querySelectorAll('[data-plan]').forEach((b) => { b.onclick = () => { s.planId = b.dataset.plan; audio.sfx('pop'); close(); render(); }; });
    };
    const close = () => { m.remove(); back?.focus?.(); };
    m.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    m.addEventListener('click', (e) => { if (e.target === m) close(); });
    document.body.appendChild(m);
    draw();
    m.querySelector('[aria-selected="true"]').focus();
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
    <section class="sec pdp-tabs" id="pdp-tabs"></section>
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
  const plan = planById(it.planId); // 예전 장바구니의 없어진 요금제는 기본 요금제로
  const card = CARDS.find((c) => c.id === it.cardId) ?? null;
  return p && { p, plan, card, q: quote({ product: p, storageIdx: it.storageIdx, supportType: it.supportType, plan, months: it.months, card, joinType: it.joinType }) };
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
            <div class="line-act">
              <button type="button" class="btn small" data-buy="${it.key}">주문하기</button>
              <button type="button" class="x" data-key="${it.key}" aria-label="${p.name} 삭제">삭제</button>
            </div>
          </li>`).join('')}
      </ul>
      <p class="total"><span>월 예상 합계</span><b>${won(total)}</b></p>
      <p class="note">휴대폰은 회선마다 개통 신청을 따로 해서, 한 대씩 주문해요.</p>` : `
      <p class="empty">장바구니가 비어 있어요.</p><a class="btn" href="#/products">휴대폰 보러 가기</a>`}
    </section>`, 'cart');
  app.querySelectorAll('.x').forEach((b) => { b.onclick = () => { cart.remove(b.dataset.key); viewCart(); }; });
  app.querySelectorAll('[data-buy]').forEach((b) => { b.onclick = () => purchase.startBuy(cart.items().find((i) => i.key === b.dataset.buy)); });
}

// ---------- 구매 · 회원 ----------
const purchase = createPurchase({ app, shell, toast, asset, byId, lineQuote, subsidyRows });

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
  else if (parts[0] === 'buy') purchase.viewBuy();
  else if (parts[0] === 'order' && parts[1] === 'done') purchase.viewOrderDone(params);
  else if (parts[0] === 'order') purchase.viewOrder();
  else if (parts[0] === 'orders') purchase.viewOrders();
  else if (parts[0] === 'login') purchase.viewLogin(params);
  else if (parts[0] === 'signup') purchase.viewSignup(params);
  else if (parts[0] === 'mypage') purchase.viewMyPage();
  else if (parts[0] === 'checkout') location.hash = '#/cart';
  else viewNotFound();
}

addEventListener('hashchange', route);
route();
