// 구매 흐름: 회원/비회원 선택 → 주문서 5단계 → 신청 완료 → 주문 조회, 그리고 로그인·3초 가입·마이페이지.
import { JOIN_TYPES, SUPPORT_TYPES, CARRIERS } from './config.js';
import { won } from './pricing.js';
import { account, PROVIDERS, isRealLogin, startRealLogin } from './account.js';
import { orders, STATUS_STEPS, digits, isValidPhone, isValidBirth, ageOn, needsStrongId, carrierError } from './orders.js';
import { cart } from './cart.js';

const CHECKOUT = 'tps-checkout-v1';
export const checkout = {
  get() { try { return JSON.parse(sessionStorage.getItem(CHECKOUT)); } catch { return null; } },
  set(v) { try { sessionStorage.setItem(CHECKOUT, JSON.stringify(v)); } catch { /* 무시 */ } },
  clear() { try { sessionStorage.removeItem(CHECKOUT); } catch { /* 무시 */ } },
};

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const label = (arr, id) => arr.find((x) => x.id === id)?.label ?? '';
const fmtPhone = (s) => digits(s).replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3');
const fmtDate = (iso) => new Date(iso).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
const signedIn = () => { const u = account.current(); return u?.signupDone ? u : null; };

const STRONG_ID = [
  { id: 'face', label: '안면인증', desc: '통신사 앱·PASS에서 신분증과 얼굴 사진을 대조' },
  { id: 'mobile-id', label: '모바일 신분증', desc: '행정안전부 모바일 신분증 앱으로 확인 (미리 발급 필요)' },
  { id: 'abstract', label: '주민등록초본', desc: '개통 당일 발급한 초본 제출' },
];
const DELIVERY = [
  { id: 'parcel', label: '택배 (무료)', desc: '보통 1~2일, 도서·산간은 추가 소요' },
  { id: 'quick', label: '당일 퀵', desc: '서울·수도권, 오후 4시 이전 개통 완료 시' },
];
const PAY = [
  { id: 'card', label: '신용·체크카드' },
  { id: 'bank', label: '실시간 계좌이체' },
  { id: 'vbank', label: '무통장 입금' },
];

export function createPurchase({ app, shell, toast, asset, byId, lineQuote }) {
  // ---------- 소셜 로그인 버튼 ----------
  const socialHtml = (verb = '3초 가입 · 로그인') => `
    <div class="social">
      <button type="button" class="sbtn kakao" data-provider="kakao"><span class="sico" aria-hidden="true">●</span>카카오로 ${verb}</button>
      <button type="button" class="sbtn naver" data-provider="naver"><span class="sico" aria-hidden="true">N</span>네이버로 ${verb}</button>
      <button type="button" class="sbtn google" data-provider="google"><span class="sico" aria-hidden="true">G</span>Google로 ${verb}</button>
    </div>
    <p class="note">처음이면 바로 가입되고, 이미 가입했다면 로그인돼요. 비밀번호를 따로 만들지 않아요.</p>`;

  function bindSocial(root, next) {
    root.querySelectorAll('[data-provider]').forEach((b) => {
      b.onclick = () => (isRealLogin(b.dataset.provider) ? startRealLogin(b.dataset.provider, next) : demoLogin(b.dataset.provider, next));
    });
  }

  // 앱 키가 없을 때: 실제 로그인 창 대신 이 사이트의 안내 창에서 데모 계정을 만든다
  function demoLogin(provider, next) {
    const p = PROVIDERS[provider];
    const back = document.activeElement;
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `
      <form class="modal-box" role="dialog" aria-modal="true" aria-labelledby="dm-title" novalidate>
        <h2 id="dm-title">${p.label} 로그인 (데모)</h2>
        <p class="note">아직 ${p.label} 앱 키가 연결되지 않아 실제 ${p.label} 로그인 창 대신 데모 계정을 만들어요. 이 브라우저에만 저장돼요.</p>
        <label>이름 <input id="dm-name" autocomplete="name" required value="데모 사용자"></label>
        <label>이메일 <input id="dm-email" type="email" autocomplete="email" required value="demo-${provider}@example.com"></label>
        <p class="form-msg" role="status"></p>
        <div class="row2"><button type="button" class="btn ghost" data-close>취소</button><button class="btn" type="submit">데모 계정으로 계속</button></div>
      </form>`;
    document.body.appendChild(m);
    const close = () => { m.remove(); back?.focus?.(); };
    m.querySelector('[data-close]').onclick = close;
    m.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    m.querySelector('#dm-name').focus();
    m.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const name = m.querySelector('#dm-name').value.trim(), email = m.querySelector('#dm-email').value.trim();
      if (!name || !/^\S+@\S+\.\S+$/.test(email)) { m.querySelector('.form-msg').textContent = '이름과 이메일을 확인해 주세요.'; return; }
      const { isNew } = account.socialSignIn(provider, { name, email, demo: true });
      m.remove();
      location.hash = isNew ? `#/signup?next=${encodeURIComponent(next)}` : next;
    };
  }

  // ---------- 로그인 ----------
  function viewLogin(params) {
    const next = params.get('next') || '#/mypage';
    if (signedIn()) { location.hash = next; return; }
    app.innerHTML = shell(`
      <section class="sec narrow">
        <h1 class="page-title">로그인 · 3초 가입</h1>
        ${socialHtml()}
        <div class="divider"><span>주문 내역만 확인하려면</span></div>
        <a class="btn ghost block" href="#/orders">비회원 주문 조회</a>
      </section>`, 'login');
    bindSocial(app, next);
  }

  // ---------- 가입 약관 동의 ----------
  function viewSignup(params) {
    const next = params.get('next') || '#/mypage';
    const u = account.current();
    if (!u) { location.hash = `#/login?next=${encodeURIComponent(next)}`; return; }
    if (u.signupDone) { location.hash = next; return; }
    app.innerHTML = shell(`
      <section class="sec narrow">
        <p class="step-eyebrow">${PROVIDERS[u.provider].label} 계정 확인 완료</p>
        <h1 class="page-title">${esc(u.name)}님, 가입을 마무리할게요</h1>
        <form class="form" novalidate>
          <label class="check all"><input type="checkbox" id="agree-all"> 전체 동의</label>
          <div class="agree-list">
            <label class="check"><input type="checkbox" name="age14" required> (필수) 만 14세 이상이에요</label>
            <label class="check"><input type="checkbox" name="terms" required> (필수) 서비스 이용약관 동의</label>
            <label class="check"><input type="checkbox" name="privacy" required> (필수) 개인정보 수집·이용 동의 <small>이름, 이메일, 소셜 계정 식별값 · 탈퇴 시까지</small></label>
            <label class="check"><input type="checkbox" name="marketing"> (선택) 할인·이벤트 소식 받기</label>
          </div>
          <p class="form-msg" role="status" aria-live="polite"></p>
          <button class="btn block" type="submit">가입 완료</button>
        </form>
      </section>`, 'login');
    const form = app.querySelector('form');
    bindAgreeAll(form);
    form.onsubmit = (e) => {
      e.preventDefault();
      const miss = [...form.querySelectorAll('[required]')].find((c) => !c.checked);
      if (miss) { form.querySelector('.form-msg').textContent = '필수 항목에 동의해 주세요.'; miss.focus(); return; }
      account.update({ signupDone: true, consentAt: new Date().toISOString(), marketing: form.marketing.checked });
      toast('가입이 완료됐어요');
      location.hash = next;
    };
  }

  function bindAgreeAll(form) {
    const all = form.querySelector('#agree-all');
    const boxes = [...form.querySelectorAll('.agree-list input[type=checkbox]')];
    all.onchange = () => boxes.forEach((b) => { b.checked = all.checked; });
    boxes.forEach((b) => { b.onchange = () => { all.checked = boxes.every((x) => x.checked); }; });
  }

  // ---------- 주문 상품 요약 ----------
  function itemSummary(item, compact = false) {
    const lq = lineQuote(item);
    if (!lq?.q) return '<p class="warn">주문할 상품 정보를 찾을 수 없어요.</p>';
    const { p, plan, q } = lq;
    return `
      <div class="osum ${compact ? 'compact' : ''}">
        <img src="${asset(p.image)}" alt="" width="80" height="80">
        <div>
          <h3>${p.name}</h3>
          <p class="muted">${esc(item.colorName)} · ${p.storages[item.storageIdx]} · ${label(JOIN_TYPES, item.joinType)} · ${label(SUPPORT_TYPES, item.supportType)}</p>
          <p class="muted">${plan.name} · ${item.months ? `${item.months}개월 할부` : '일시납'}</p>
          <p class="line-price">월 ${won(q.totalMonthly)}${q.upfront ? ` <span class="muted">+ 일시납 ${won(q.upfront)}</span>` : ''}</p>
        </div>
      </div>`;
  }

  // ---------- 구매 시작: 회원 / 비회원 ----------
  function viewBuy() {
    const co = checkout.get();
    if (!co?.item) { location.hash = '#/cart'; return; }
    if (signedIn()) { checkout.set({ ...co, mode: 'member' }); location.hash = '#/order'; return; }
    app.innerHTML = shell(`
      <section class="sec narrow">
        <h1 class="page-title">어떻게 구매할까요?</h1>
        ${itemSummary(co.item, true)}
        <div class="buy-choice">
          <div class="choice">
            <h2>회원으로 구매</h2>
            <ul class="ticks"><li>주문·개통 진행 상황을 마이페이지에서 바로 확인</li><li>배송지 저장으로 다음 구매가 빨라요</li><li>할인·사은품 소식 받기 (선택)</li></ul>
            ${socialHtml('3초 가입하고 구매')}
          </div>
          <div class="choice">
            <h2>비회원으로 구매</h2>
            <ul class="ticks"><li>가입 없이 바로 주문서 작성</li><li>주문 조회는 이름 · 휴대폰 번호 · 주문번호로</li><li>배송지·주문 내역이 계정에 저장되지 않아요</li></ul>
            <button type="button" class="btn ghost block" id="guest">비회원으로 계속</button>
          </div>
        </div>
      </section>`, 'cart');
    bindSocial(app, '#/order');
    document.getElementById('guest').onclick = () => { checkout.set({ ...co, mode: 'guest' }); location.hash = '#/order'; };
  }

  // ---------- 주문서 ----------
  const STEPS = ['상품 확인', '본인인증', '배송 정보', '약관 동의', '결제'];

  function viewOrder() {
    const co = checkout.get();
    if (!co?.item) { location.hash = '#/cart'; return; }
    const user = signedIn();
    const mode = user ? 'member' : co.mode === 'guest' ? 'guest' : null;
    if (!mode) { location.hash = '#/buy'; return; }
    const lq = lineQuote(co.item);
    if (!lq?.q) { location.hash = '#/cart'; return; }
    const item = co.item;
    const strong = needsStrongId(item.joinType);
    const f = co.form ?? {
      name: user?.name ?? '', birth: '', phone: '', carrier: item.joinType === 'change' ? 'KT' : '', code: '', verified: false, sentCode: '',
      guardian: false, strongId: '',
      recv: '', recvPhone: '', zip: user?.address?.zip ?? '', addr1: user?.address?.addr1 ?? '', addr2: user?.address?.addr2 ?? '',
      delivery: 'parcel', memo: '', saveAddr: true, agrees: {}, pay: 'card',
    };
    let step = co.step ?? 0;
    // 인증은 인증번호를 받은 번호·통신사 그대로일 때만 유효하다
    const idKey = () => `${digits(f.phone)}|${f.carrier}`;
    const isVerified = () => f.verified && f.sentTo === idKey();
    const persist = () => checkout.set({ ...co, mode, form: f, step });

    const radios = (name, list, cur) => `<div class="opts" role="radiogroup">${list.map((o) => `<button type="button" role="radio" class="opt" data-r="${name}" data-v="${o.id}" aria-checked="${o.id === cur}">${o.label}${o.desc ? `<small>${o.desc}</small>` : ''}</button>`).join('')}</div>`;

    function stepBody() {
      const age = isValidBirth(f.birth) ? ageOn(f.birth) : null;
      if (step === 0) return `
        <h2>주문할 상품</h2>${itemSummary(item)}
        <dl class="kv">
          <dt>출고가</dt><dd>${won(lq.q.retail)}</dd><dt>기기값 할인</dt><dd>-${won(lq.q.deviceDiscount)}</dd>
          <dt>할부원금</dt><dd>${won(lq.q.principal)}</dd><dt>월 할부금</dt><dd>${won(lq.q.deviceMonthly)}</dd>
          <dt>월 통신요금</dt><dd>${won(lq.q.planMonthly)}</dd>
        </dl>
        <p class="note">지원금은 개통 시점 정책으로 확정돼요. 옵션을 바꾸려면 <a href="#/products/${item.productId}">상품 화면</a>으로 돌아가세요.</p>`;
      if (step === 1) return `
        <h2>가입자(명의자) 본인인증</h2>
        <p class="note">개통할 휴대폰의 명의자 정보를 입력해 주세요. 다른 사람 명의로는 신청할 수 없어요.</p>
        <label>이름 <input id="f-name" autocomplete="name" value="${esc(f.name)}"></label>
        <label>생년월일 6자리 <input id="f-birth" inputmode="numeric" maxlength="6" placeholder="예: 950101" value="${esc(f.birth)}"></label>
        <label>현재 통신사 <select id="f-carrier"><option value="">선택</option>${CARRIERS.map((c) => `<option ${c === f.carrier ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <label>${item.joinType === 'new' ? '연락받을 휴대폰 번호' : '쓰던 휴대폰 번호'} <span class="inline"><input id="f-phone" type="tel" inputmode="numeric" autocomplete="tel" value="${esc(f.phone)}"><button type="button" class="btn ghost" id="send">${f.sentCode ? '다시 받기' : '인증번호 받기'}</button></span></label>
        ${f.sentCode ? `<p class="demo-note">데모: 문자 발송 대신 인증번호를 보여드려요 → <b>${f.sentCode}</b></p>
        <label>인증번호 <span class="inline"><input id="f-code" inputmode="numeric" maxlength="6" value="${esc(f.code)}"><button type="button" class="btn ghost" id="verify">확인</button></span></label>` : ''}
        ${isVerified() ? '<p class="ok">✓ 휴대폰 본인인증 완료</p>' : ''}
        ${age != null && age < 19 ? `<div class="warnbox">만 19세 미만은 법정대리인 동의서와 가족관계증명서가 필요해요. 공식신청서 단계에서 제출해요.
          <label class="check"><input type="checkbox" id="f-guardian" ${f.guardian ? 'checked' : ''}> 법정대리인 동의 서류를 준비할게요</label></div>` : ''}
        ${strong ? `<h3 class="opt-title">개통 때 추가 본인확인 방법</h3>
          <p class="note">2026년 7월 6일부터 ${label(JOIN_TYPES, item.joinType)}은 온라인에서도 아래 중 하나로 본인확인을 해야 개통돼요. (기기변경은 제외)</p>
          ${radios('strongId', STRONG_ID, f.strongId)}` : ''}`;
      if (step === 2) return `
        <h2>배송 정보</h2>
        <label>받는 분 <input id="f-recv" autocomplete="name" value="${esc(f.recv || f.name)}"></label>
        <label>받는 분 연락처 <input id="f-recvPhone" type="tel" inputmode="numeric" autocomplete="tel" value="${esc(f.recvPhone || f.phone)}"></label>
        <label>우편번호 <input id="f-zip" inputmode="numeric" maxlength="5" autocomplete="postal-code" value="${esc(f.zip)}"></label>
        <label>주소 <input id="f-addr1" autocomplete="address-line1" value="${esc(f.addr1)}"></label>
        <label>상세 주소 <input id="f-addr2" autocomplete="address-line2" value="${esc(f.addr2)}"></label>
        <p class="note">실제 서비스에서는 우편번호 검색(주소 API)으로 입력해요.</p>
        <h3 class="opt-title">배송 방법</h3>${radios('delivery', DELIVERY, f.delivery)}
        <label>배송 요청사항 <select id="f-memo">${['', '문 앞에 놓아주세요', '경비실에 맡겨주세요', '배송 전 연락 주세요'].map((m) => `<option value="${m}" ${m === f.memo ? 'selected' : ''}>${m || '선택 안 함'}</option>`).join('')}</select></label>
        ${mode === 'member' ? `<label class="check"><input type="checkbox" id="f-saveAddr" ${f.saveAddr ? 'checked' : ''}> 기본 배송지로 저장</label>` : ''}`;
      if (step === 3) {
        const req = [
          ['order', '구매 조건 확인 및 주문 진행 동의', '상품·요금제·할인 조건과 약정(24개월), 할부수수료(연 5.9%)를 확인했어요.'],
          ['collect', '개인정보 수집·이용 동의', `${mode === 'guest' ? '비회원 주문을 위해 ' : ''}이름, 생년월일, 휴대폰 번호, 배송지를 주문 처리·개통·배송에 사용하고 관련 법령 기간 동안 보관해요.`],
          ['third', '개인정보 제3자 제공 동의 (KT)', '개통 처리를 위해 KT에 이름, 생년월일, 휴대폰 번호, 가입 정보를 제공해요.'],
          ['carrier', '통신사 가입 유의사항 확인', '약정 기간 안에 해지하면 위약금이 생길 수 있고, 지원금은 개통 시점 정책으로 확정돼요.'],
        ];
        return `
          <h2>약관 동의</h2>
          <div class="form">
            <label class="check all"><input type="checkbox" id="agree-all"> 전체 동의</label>
            <div class="agree-list">
              ${req.map(([k, t, d]) => `<div class="agree"><label class="check"><input type="checkbox" data-agree="${k}" required ${f.agrees[k] ? 'checked' : ''}> (필수) ${t}</label><details><summary>보기</summary><p>${d}</p></details></div>`).join('')}
              <div class="agree"><label class="check"><input type="checkbox" data-agree="marketing" ${f.agrees.marketing ? 'checked' : ''}> (선택) 할인·이벤트 소식 받기</label></div>
            </div>
          </div>`;
      }
      return `
        <h2>결제</h2>${itemSummary(item, true)}
        ${item.months ? `<div class="paybox"><p>오늘 결제할 금액</p><b>0원</b>
          <p class="note">할부 구매는 지금 결제하지 않아요. 단말 할부금(월 ${won(lq.q.deviceMonthly)})은 개통 후 통신요금과 함께 매달 청구돼요.</p></div>`
        : `<div class="paybox"><p>오늘 결제할 금액 (일시납)</p><b>${won(lq.q.upfront)}</b></div>
          <h3 class="opt-title">결제 수단</h3>${radios('pay', PAY, f.pay)}`}
        <p class="demo-note">프로토타입: 결제 대행(PG)이 연결되지 않아 실제 결제·주문 접수가 되지 않아요. 주문은 이 브라우저에만 저장돼요.</p>`;
    }

    function validate() {
      if (step === 1) {
        if (!f.name.trim()) return ['f-name', '명의자 이름을 입력해 주세요.'];
        if (!isValidBirth(f.birth)) return ['f-birth', '생년월일 6자리를 확인해 주세요. (예: 950101)'];
        if (!f.carrier) return ['f-carrier', '현재 통신사를 선택해 주세요.'];
        const ce = carrierError(item.joinType, f.carrier); if (ce) return ['f-carrier', ce];
        if (!isValidPhone(f.phone)) return ['f-phone', '휴대폰 번호를 확인해 주세요.'];
        if (!isVerified()) return [f.sentCode ? 'f-code' : 'send', f.verified ? '번호나 통신사가 바뀌었어요. 인증을 다시 받아 주세요.' : '휴대폰 본인인증을 완료해 주세요.'];
        if (ageOn(f.birth) < 19 && !f.guardian) return ['f-guardian', '법정대리인 동의 서류 준비에 체크해 주세요.'];
        if (strong && !f.strongId) return [null, '개통 때 추가 본인확인 방법을 골라 주세요.'];
      }
      if (step === 2) {
        if (!f.recv.trim()) return ['f-recv', '받는 분 이름을 입력해 주세요.'];
        if (!isValidPhone(f.recvPhone)) return ['f-recvPhone', '받는 분 연락처를 확인해 주세요.'];
        if (!/^\d{5}$/.test(f.zip)) return ['f-zip', '우편번호 5자리를 입력해 주세요.'];
        if (!f.addr1.trim()) return ['f-addr1', '주소를 입력해 주세요.'];
        if (!f.addr2.trim()) return ['f-addr2', '상세 주소를 입력해 주세요.'];
      }
      if (step === 3 && !['order', 'collect', 'third', 'carrier'].every((k) => f.agrees[k])) return [null, '필수 약관에 모두 동의해 주세요.'];
      return null;
    }

    function readInputs() {
      const val = (id) => document.getElementById(id)?.value;
      [['f-name', 'name'], ['f-birth', 'birth'], ['f-carrier', 'carrier'], ['f-phone', 'phone'], ['f-code', 'code'], ['f-recv', 'recv'], ['f-recvPhone', 'recvPhone'], ['f-zip', 'zip'], ['f-addr1', 'addr1'], ['f-addr2', 'addr2'], ['f-memo', 'memo']]
        .forEach(([id, k]) => { const v = val(id); if (v != null) f[k] = v; });
      const g = document.getElementById('f-guardian'); if (g) f.guardian = g.checked;
      const sa = document.getElementById('f-saveAddr'); if (sa) f.saveAddr = sa.checked;
      document.querySelectorAll('[data-agree]').forEach((c) => { f.agrees[c.dataset.agree] = c.checked; });
    }

    function render(focusId) {
      app.innerHTML = shell(`
        <section class="sec narrow">
          <p class="step-eyebrow">${mode === 'member' ? `${esc(user.name)}님 · 회원 주문` : '비회원 주문'}</p>
          <h1 class="page-title">주문서 작성</h1>
          <ol class="stepper">${STEPS.map((s, i) => `<li class="${i < step ? 'done' : i === step ? 'on' : ''}" ${i === step ? 'aria-current="step"' : ''}><span>${i + 1}</span>${s}</li>`).join('')}</ol>
          <div class="ostep form">${stepBody()}</div>
          <p class="form-msg" role="status" aria-live="polite"></p>
          <div class="row2">
            ${step ? '<button type="button" class="btn ghost" id="prev">이전</button>' : `<a class="btn ghost" href="#/products/${item.productId}">옵션 변경</a>`}
            <button type="button" class="btn" id="next">${step === STEPS.length - 1 ? '주문 신청하기' : '다음'}</button>
          </div>
        </section>`, 'cart');
      const msg = app.querySelector('.form-msg');
      app.querySelectorAll('[data-r]').forEach((b) => { b.onclick = () => { readInputs(); f[b.dataset.r] = b.dataset.v; persist(); render(); }; });
      const all = document.getElementById('agree-all');
      if (all) {
        const boxes = [...app.querySelectorAll('[data-agree]')];
        all.checked = boxes.every((x) => x.checked);
        all.onchange = () => boxes.forEach((b) => { b.checked = all.checked; });
        boxes.forEach((b) => { b.onchange = () => { all.checked = boxes.every((x) => x.checked); }; });
      }
      document.getElementById('send')?.addEventListener('click', () => {
        readInputs();
        if (!isValidPhone(f.phone)) { msg.textContent = '휴대폰 번호를 확인해 주세요.'; document.getElementById('f-phone').focus(); return; }
        f.sentCode = String(Math.floor(100000 + Math.random() * 900000)); f.verified = false; f.code = ''; f.sentTo = idKey();
        persist(); render('f-code');
      });
      document.getElementById('verify')?.addEventListener('click', () => {
        readInputs();
        if (f.sentTo !== idKey()) { msg.textContent = '번호나 통신사가 바뀌었어요. 인증번호를 다시 받아 주세요.'; return; }
        if (f.code === f.sentCode) { f.verified = true; persist(); render(); toast('본인인증이 완료됐어요'); } else { msg.textContent = '인증번호가 맞지 않아요.'; document.getElementById('f-code').focus(); }
      });
      document.getElementById('prev')?.addEventListener('click', () => { readInputs(); step--; persist(); render(); scrollTo(0, 0); });
      document.getElementById('next').onclick = () => {
        readInputs();
        const err = validate();
        if (err) { msg.textContent = err[1]; (err[0] && document.getElementById(err[0]))?.focus(); persist(); return; }
        if (step < STEPS.length - 1) { step++; persist(); render(); scrollTo(0, 0); return; }
        submit();
      };
      if (focusId) document.getElementById(focusId)?.focus();
    }

    function submit() {
      const o = orders.create({
        guest: mode === 'guest', userId: user?.id ?? null,
        item, quote: lq.q, productName: lq.p.name, planName: lq.plan.name,
        subscriber: { name: f.name.trim(), birth: digits(f.birth), phone: digits(f.phone), carrier: f.carrier },
        strongId: strong ? f.strongId : null,
        shipping: { recv: f.recv.trim(), phone: digits(f.recvPhone), zip: f.zip, addr1: f.addr1.trim(), addr2: f.addr2.trim(), method: f.delivery, memo: f.memo },
        pay: item.months ? 'installment' : f.pay, marketing: !!f.agrees.marketing,
      });
      if (mode === 'member' && f.saveAddr) account.update({ address: { zip: f.zip, addr1: f.addr1.trim(), addr2: f.addr2.trim() } });
      if (item.key) cart.remove(item.key);
      checkout.clear();
      location.hash = `#/order/done?no=${o.no}`;
    }

    render();
  }

  // ---------- 주문 상태 표시 ----------
  function timeline(o) {
    const cur = STATUS_STEPS.findIndex((s) => s.id === o.status);
    return `<ol class="timeline">${STATUS_STEPS.map((s, i) => `<li class="${i <= cur ? 'done' : ''}">${s.label}</li>`).join('')}</ol>`;
  }
  function orderCard(o) {
    return `
      <article class="ocard">
        <p class="muted">${fmtDate(o.createdAt)} · 주문번호 <b>${o.no}</b></p>
        ${itemSummary(o.item, true)}
        ${timeline(o)}
        <p class="note">받는 분 ${esc(o.shipping.recv)} · ${esc(o.shipping.addr1)} ${esc(o.shipping.addr2)} · ${label(DELIVERY, o.shipping.method)}</p>
      </article>`;
  }

  function viewOrderDone(params) {
    const o = orders.get(params.get('no'));
    if (!o) { location.hash = '#/orders'; return; }
    app.innerHTML = shell(`
      <section class="sec narrow">
        <p class="step-eyebrow">데모 주문 · 실제 접수되지 않았어요</p>
        <h1 class="page-title">주문 신청이 완료됐어요</h1>
        <div class="orderno"><span>주문번호</span><b id="ono">${o.no}</b><button type="button" class="btn ghost" id="copy">복사</button></div>
        ${o.guest ? '<p class="warnbox">비회원 주문은 <b>이름 · 휴대폰 번호 · 주문번호</b>로 조회해요. 주문번호를 꼭 저장해 두세요.</p>' : '<p class="note">주문 내역은 마이페이지에서 언제든 확인할 수 있어요.</p>'}
        ${timeline(o)}
        <h2 class="sub">다음 단계</h2>
        <ol class="next-steps">
          <li><b>통신사 공식신청서 작성</b> — 명의자 정보로 KT 공식신청서를 작성해야 개통이 진행돼요.</li>
          ${o.strongId ? `<li><b>추가 본인확인</b> — 선택한 방법(${label(STRONG_ID, o.strongId)})으로 개통 전에 확인해요.</li>` : ''}
          <li><b>개통 · 배송</b> — 개통이 끝나면 ${label(DELIVERY, o.shipping.method)}으로 보내드려요.</li>
        </ol>
        <button type="button" class="btn block" id="form">KT 공식신청서 작성하기</button>
        <div class="row2"><a class="btn ghost" href="${o.guest ? '#/orders' : '#/mypage'}">주문 조회</a><a class="btn ghost" href="#/">쇼핑 계속하기</a></div>
      </section>`, 'cart');
    document.getElementById('copy').onclick = async () => {
      try { await navigator.clipboard.writeText(o.no); toast('주문번호를 복사했어요'); } catch { getSelection().selectAllChildren(document.getElementById('ono')); toast('주문번호를 선택했어요. 복사해 주세요.'); }
    };
    document.getElementById('form').onclick = () => toast('프로토타입이라 공식신청서 페이지가 연결되지 않았어요.');
  }

  // ---------- 주문 조회 ----------
  function viewOrders() {
    const user = signedIn();
    if (user) {
      const list = orders.byUser(user.id);
      app.innerHTML = shell(`<section class="sec narrow"><h1 class="page-title">주문 내역</h1>
        ${list.length ? list.map(orderCard).join('') : '<p class="empty">아직 주문 내역이 없어요.</p><a class="btn" href="#/products">휴대폰 보러 가기</a>'}</section>`, 'login');
      return;
    }
    app.innerHTML = shell(`
      <section class="sec narrow">
        <h1 class="page-title">비회원 주문 조회</h1>
        <form class="form" novalidate>
          <label>주문자(명의자) 이름 <input id="q-name" autocomplete="name"></label>
          <label>휴대폰 번호 <input id="q-phone" type="tel" inputmode="numeric" autocomplete="tel"></label>
          <label>주문번호 <input id="q-no" placeholder="예: PS261122000000" autocapitalize="characters"></label>
          <p class="form-msg" role="status" aria-live="polite"></p>
          <button class="btn block" type="submit">조회하기</button>
        </form>
        <div id="q-result"></div>
        <div class="divider"><span>회원이라면</span></div>
        <a class="btn ghost block" href="#/login?next=%23%2Forders">로그인하고 주문 내역 보기</a>
      </section>`, 'login');
    const form = app.querySelector('form');
    form.onsubmit = (e) => {
      e.preventDefault();
      const q = { name: form.querySelector('#q-name').value, phone: form.querySelector('#q-phone').value, orderNo: form.querySelector('#q-no').value };
      const o = orders.findGuest(q);
      form.querySelector('.form-msg').textContent = o ? '' : '일치하는 주문이 없어요. 이름 · 휴대폰 번호 · 주문번호를 다시 확인해 주세요.';
      document.getElementById('q-result').innerHTML = o ? orderCard(o) : '';
    };
  }

  // ---------- 마이페이지 ----------
  function viewMyPage() {
    const user = account.current();
    if (!user) { location.hash = '#/login?next=%23%2Fmypage'; return; }
    if (!user.signupDone) { location.hash = '#/signup?next=%23%2Fmypage'; return; }
    const list = orders.byUser(user.id);
    app.innerHTML = shell(`
      <section class="sec narrow">
        <h1 class="page-title">마이페이지</h1>
        <div class="profile">
          <span class="pbadge ${user.provider}">${PROVIDERS[user.provider].label}</span>
          <div><b>${esc(user.name)}</b><p class="muted">${esc(user.email)}${user.demo ? ' · 데모 계정' : ''}</p></div>
        </div>
        ${user.address ? `<p class="note">기본 배송지: (${esc(user.address.zip)}) ${esc(user.address.addr1)} ${esc(user.address.addr2)}</p>` : ''}
        <h2 class="sub">주문 내역 <span class="muted">${list.length}건</span></h2>
        ${list.length ? list.map(orderCard).join('') : '<p class="empty">아직 주문 내역이 없어요.</p>'}
        <div class="row2"><button type="button" class="btn ghost" id="logout">로그아웃</button><button type="button" class="btn ghost" id="withdraw">회원 탈퇴</button></div>
        <div id="confirm" hidden class="warnbox">탈퇴하면 계정과 주문 내역이 이 브라우저에서 지워져요.
          <div class="row2"><button type="button" class="btn ghost" id="cancel">취소</button><button type="button" class="btn" id="really">탈퇴하기</button></div></div>
      </section>`, 'login');
    document.getElementById('logout').onclick = () => { account.logout(); toast('로그아웃했어요'); location.hash = '#/'; };
    document.getElementById('withdraw').onclick = () => { const c = document.getElementById('confirm'); c.hidden = false; document.getElementById('cancel').focus(); };
    document.getElementById('cancel').onclick = () => { document.getElementById('confirm').hidden = true; };
    document.getElementById('really').onclick = () => { orders.removeByUser(user.id); account.withdraw(); toast('탈퇴가 완료됐어요'); location.hash = '#/'; };
  }

  // 상세·장바구니에서 구매 시작
  function startBuy(item) { checkout.set({ item }); location.hash = '#/buy'; }

  return { viewLogin, viewSignup, viewBuy, viewOrder, viewOrderDone, viewOrders, viewMyPage, startBuy };
}
