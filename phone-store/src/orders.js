// 주문 저장소와 주문서 검증 규칙.
// 프로토타입: 주문은 이 브라우저 localStorage에만 저장된다. 실제 서비스는 서버에 저장하고 서버에서 다시 검증해야 한다.

const KEY = 'tps-orders-v1';

export const digits = (s = '') => String(s).replace(/\D/g, '');

// 휴대폰 번호: 010·011·016~019, 10~11자리
export const isValidPhone = (s) => /^01[016789]\d{7,8}$/.test(digits(s));

// 생년월일 6자리(YYMMDD)가 실제 있는 날짜인지
export function isValidBirth(s) {
  const d = digits(s);
  if (d.length !== 6) return false;
  const yy = +d.slice(0, 2), mm = +d.slice(2, 4), dd = +d.slice(4, 6);
  const year = birthYear(d);
  const date = new Date(year, mm - 1, dd);
  return mm >= 1 && mm <= 12 && date.getMonth() === mm - 1 && date.getDate() === dd && yy >= 0;
}

// 두 자리 연도는 올해 기준으로 미래면 1900년대로 본다
export function birthYear(yymmdd, now = new Date()) {
  const yy = +digits(yymmdd).slice(0, 2);
  const cur = now.getFullYear() % 100;
  return yy > cur ? 1900 + yy : 2000 + yy;
}

// 만 나이
export function ageOn(yymmdd, now = new Date()) {
  const d = digits(yymmdd);
  const y = birthYear(d, now), m = +d.slice(2, 4), day = +d.slice(4, 6);
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < day)) age--;
  return age;
}

// 2026-07-06부터 신규가입·번호이동은 강화된 본인확인(안면인증·모바일 신분증·당일 발급 초본)이 필요. 기기변경은 제외.
export const needsStrongId = (joinType) => joinType === 'port' || joinType === 'new';

// 가입유형과 현재 통신사가 맞는지 (기기변경은 KT 이용자만, 번호이동은 KT 외 통신사만)
export function carrierError(joinType, carrier) {
  if (joinType === 'change' && carrier !== 'KT') return '기기변경은 지금 KT를 쓰는 번호만 할 수 있어요. 다른 통신사라면 번호이동을 선택해 주세요.';
  if (joinType === 'port' && carrier === 'KT') return '이미 KT를 쓰고 있다면 번호이동이 아니라 기기변경이에요.';
  return null;
}

// 주문번호: PS + YYMMDD + 6자리
export function makeOrderNo(now = new Date(), rnd = Math.random) {
  const p = (n) => String(n).padStart(2, '0');
  return `PS${p(now.getFullYear() % 100)}${p(now.getMonth() + 1)}${p(now.getDate())}${String(Math.floor(rnd() * 1e6)).padStart(6, '0')}`;
}

// 비회원 주문조회: 이름·휴대폰·주문번호가 모두 맞아야 한다
export function matchGuestOrder(order, { name, phone, orderNo }) {
  return order.guest === true
    && order.no === String(orderNo).trim().toUpperCase()
    && order.subscriber.name === String(name).trim()
    && digits(order.subscriber.phone) === digits(phone);
}

function read() { try { return JSON.parse(localStorage.getItem(KEY)) ?? []; } catch { return []; } }
function write(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* 저장소 사용 불가 */ } }

export const orders = {
  create(order) {
    const o = { ...order, no: makeOrderNo(), createdAt: new Date().toISOString(), status: 'received' };
    write([o, ...read()]);
    return o;
  },
  get: (no) => read().find((o) => o.no === no) ?? null,
  byUser: (userId) => read().filter((o) => o.userId === userId),
  findGuest: (q) => read().find((o) => matchGuestOrder(o, q)) ?? null,
  removeByUser: (userId) => write(read().filter((o) => o.userId !== userId)),
};

export const STATUS_STEPS = [
  { id: 'received', label: '주문 접수' },
  { id: 'form', label: '통신사 공식신청서 작성' },
  { id: 'activate', label: '본인확인 · 개통' },
  { id: 'ship', label: '배송' },
];
