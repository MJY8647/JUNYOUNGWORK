// 매장 정보와 요금 정책. 실제 운영 전 사업자 정보와 정책 값을 채워야 합니다.
export const STORE = {
  name: '작은폰가게',
  tagline: '손바닥만 한 매장에서 고르는 내 폰',
  phone: '0000-0000', // TODO: 실제 상담 번호
  hours: '평일 09:00 ~ 18:00',
  business: null, // TODO: 상호, 대표자, 사업자등록번호, 통신판매업 신고번호
};

// KT 공식 상품 페이지(5G 초이스, 2026-05-29 게시본)에서 확인한 값. VAT 포함 월정액.
export const PLANS = [
  { id: 'choice-premium', name: '5G 초이스 프리미엄', fee: 130000, data: '데이터 무제한', share: '스마트기기 공유 100GB', roaming: '로밍 최대 3Mbps 무제한' },
  { id: 'choice-special', name: '5G 초이스 스페셜', fee: 110000, data: '데이터 무제한', share: '스마트기기 공유 70GB', roaming: '로밍 최대 100Kbps 무제한' },
  { id: 'choice-basic', name: '5G 초이스 베이직', fee: 90000, data: '데이터 무제한', share: '스마트기기 공유 40GB', roaming: '로밍 최대 100Kbps 무제한' },
];

export const JOIN_TYPES = [
  { id: 'change', label: '기기변경', desc: '쓰던 KT 번호 그대로 기기만 변경' },
  { id: 'port', label: '번호이동', desc: '쓰던 번호 그대로 KT로 이동' },
  { id: 'new', label: '신규가입', desc: 'KT 새 번호로 가입' },
];

export const SUPPORT_TYPES = [
  { id: 'device', label: '기기값 할인', desc: '지원금으로 기기값을 낮춰요' },
  { id: 'plan', label: '요금할인 25%', desc: '매달 통신요금을 25% 할인' },
];

export const MONTHS = [0, 12, 24, 30, 36];
export const INSTALLMENT_RATE = 0.059; // 연 5.9% 할부수수료
export const PLAN_DISCOUNT_RATE = 0.25;
