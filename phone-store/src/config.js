// 매장 정보와 요금 정책. 실제 운영 전 사업자 정보와 정책 값을 채워야 합니다.
export const STORE = {
  name: '작은폰가게',
  tagline: '손바닥만 한 매장에서 고르는 내 폰',
  phone: '0000-0000', // TODO: 실제 상담 번호
  hours: '평일 09:00 ~ 18:00',
  business: null, // TODO: 상호, 대표자, 사업자등록번호, 통신판매업 신고번호
  sameDay: '오후 4시 이전 신청 시 당일 발송', // TODO: 실제 판매점 배송 정책
};

// KT 통합요금제 (2026-07-01 출시, 기존 5G·LTE 요금제 105종은 신규가입 중단).
// 금액은 KT 공식 상품 페이지에서 확인: 초이스(ItemCode 1685, 2026-11-06 게시), 베이직(ItemCode 1693, 2026-07-15 게시). VAT 포함 월정액.
const BASIC_DATA = [[110, 69000], [90, 67000], [70, 65000], [50, 63000], [30, 61000], [21, 58000], [14, 55000], [10, 50000], [7, 45000], [4, 37000], [1.4, 33000], [0.6, 28900]];
export const PLANS = [
  { id: 'choice-130', name: '초이스130', fee: 130000, group: 'choice', data: '데이터 무제한', share: '스마트기기 공유 100GB', roaming: '로밍 무제한 최대 1Mbps', membership: 'VVIP', choice: true },
  { id: 'choice-110', name: '초이스110', fee: 110000, group: 'choice', data: '데이터 무제한', share: '스마트기기 공유 80GB', roaming: '로밍 무제한 최대 400Kbps', membership: 'VVIP', choice: true },
  { id: 'choice-90', name: '초이스90', fee: 90000, group: 'choice', data: '데이터 무제한', share: '스마트기기 공유 60GB', roaming: '로밍 무제한 최대 400Kbps', membership: 'VIP', choice: true },
  { id: 'basic-100', name: '베이직100', fee: 100000, group: 'unlimited', data: '데이터 무제한', share: '스마트기기·데이터 쉐어링 1회선 무료', roaming: '로밍 무제한 최대 100Kbps', membership: 'VVIP' },
  { id: 'basic-80', name: '베이직80', fee: 80000, group: 'unlimited', data: '데이터 무제한', share: '', roaming: '로밍 무제한 최대 100Kbps', membership: 'VIP' },
  ...BASIC_DATA.map(([gb, fee]) => ({
    id: `basic-${gb}`, name: `베이직${gb < 1 ? `${gb * 1000}MB` : `${gb}GB`}`, fee, group: gb >= 30 ? 'data' : 'light',
    data: `기본 ${gb < 1 ? `${gb * 1000}MB` : `${gb}GB`}`, share: '소진 후 속도제어로 계속 이용', roaming: '', membership: '',
  })),
];
export const DEFAULT_PLAN = 'choice-90';
// 상세 화면에 바로 보이는 추천 요금제 3개
export const RECOMMENDED_PLANS = ['choice-90', 'basic-80', 'basic-110'];
// "다른 요금제 선택" 팝업의 분류
export const PLAN_GROUPS = [
  { id: 'choice', label: '무제한 + 혜택 고르기', desc: '데이터 무제한에 OTT·구독 혜택 하나를 골라요' },
  { id: 'unlimited', label: '무제한 실속', desc: '혜택 없이 데이터 무제한만 필요할 때' },
  { id: 'data', label: '넉넉한 데이터', desc: '30GB~110GB, 다 써도 속도제어로 계속 이용' },
  { id: 'light', label: '가볍게 쓰기', desc: '600MB~21GB, 와이파이 위주라면' },
];
export const planById = (id) => PLANS.find((p) => p.id === id) ?? PLANS.find((p) => p.id === DEFAULT_PLAN);
// 초이스 요금제에서 고르는 혜택 (택1). KT 상품 목록에서 신규가입 가능한 초이스 항목 기준.
export const CHOICE_BENEFITS = [
  { id: 'disney', label: '디즈니+', desc: '스탠다드 기본 제공' },
  { id: 'youtube', label: '유튜브 프리미엄', desc: '광고 없는 유튜브' },
  { id: 'netflix', label: '넷플릭스', desc: '넷플릭스 시청' },
  { id: 'tving', label: '티빙·지니·밀리', desc: '드라마·음악·전자책' },
  { id: 'weverse', label: '위버스', desc: '팬 커뮤니티 혜택' },
  { id: 'phonecare', label: '폰케어', desc: '단말 보험 할인' },
  { id: 'google-ai', label: 'Google AI Plus', desc: 'AI 구독' },
];
// 연령별 덤: 나이에 따라 자동 적용 (KT 공식 페이지 기준)
export const AGE_BONUS = '나이에 맞는 덤 혜택이 자동으로 붙어요: 스쿨덤(~만 18세) · Y덤(만 19~34세) · 65+덤(만 65~74세) · 75+덤(만 75세~)';

export const JOIN_TYPES = [
  { id: 'change', label: '기기변경', desc: '쓰던 KT 번호 그대로 기기만 변경' },
  { id: 'port', label: '번호이동', desc: '쓰던 번호 그대로 KT로 이동' },
  { id: 'new', label: '신규가입', desc: 'KT 새 번호로 가입' },
];

export const SUPPORT_TYPES = [
  { id: 'device', label: '기기값 할인', desc: '지원금으로 기기값을 낮춰요' },
  { id: 'plan', label: '요금할인 25%', desc: '매달 통신요금을 25% 할인' },
];

export const MONTHS = [0, 6, 12, 24, 30, 36];
export const INSTALLMENT_RATE = 0.059; // 연 5.9% 할부수수료
export const PLAN_DISCOUNT_RATE = 0.25;

// 소셜 로그인 앱 키. 각 개발자센터(카카오 developers, 네이버 developers, Google Cloud Console)에서 발급받아 넣으면
// 실제 로그인 창으로 연결된다. 비어 있으면 데모 계정으로 동작한다. client secret은 절대 여기 넣지 말고 서버에 둔다.
export const SOCIAL = {
  kakao: { clientId: '', redirectUri: '' },
  naver: { clientId: '', redirectUri: '' },
  google: { clientId: '', redirectUri: '' },
};

export const CARRIERS = ['KT', 'SKT', 'LG U+', '알뜰폰'];

// 아래는 사용자 제공 ZIP(KT초이스 상세 화면, 2026-11-19 수집)의 구성. 실제 운영 전 판매점 정책으로 교체.
export const DELIVERY = [
  { id: 'parcel', label: '우체국택배', desc: '영업일 기준 1~2일 (도서·산간 +1~2일) · 송장번호로 조회' },
  { id: 'quick', label: '당일 퀵 수령', desc: '주문 당일 수령 · 지역·시간대별 비용 별도 안내' },
  { id: 'visit', label: '매장 방문수령', desc: '재고·개통 일정 확인을 위해 방문 전 연락 필요' },
];
export const GIFTS = [
  { id: 'acc3', label: '전용 악세사리 3종 패키지', desc: '케이스 + 강화유리 필름 + 어댑터', image: 'gifts/accessory3.webp', brand: 'all' },
  { id: 'magsafe2', label: '아이폰 전용 맥세이프 2종', desc: '맥세이프 케이스 + 맥세이프 카드지갑', image: 'gifts/magsafe2.webp', brand: 'apple' },
];
// KT 제휴카드: 월 최대 청구할인액(전월 실적 조건 충족 시). 기본으로 적용하지 않는다.
export const CARDS = [
  ['KT 현대카드M Edition3(청구할인형2.0)', 40000], ['KT 가족만족 DC 신한카드', 15000], ['KT 가족만족 할부 신한카드', 15000],
  ['KT DC 롯데카드', 8000], ['KT 할부 롯데카드', 10000], ['KT DC Plus KB국민카드', 11000], ['KT DC Plus 고객용 더 심플 하나카드', 15000],
  ['KT 할부 Plus NH농협카드', 15000], ['KT 현대카드M Edition3(청구할인형)', 18000], ['KT 현대카드M Edition3(통신할인형2.0)', 25000],
  ['KT DC Plus 롯데카드', 13000], ['KT Super DC 롯데카드', 20000], ['KT DC Plus BC바로카드', 13000], ['KT SUPER DC BC바로카드', 9000],
  ['KT 할부 S 삼성카드', 20000], ['KT 삼성카드', 16000], ['KT 할부 Plus KB국민카드', 14000], ['KT 으랏차차 신한카드', 45000],
  ['KT 36 Plus 우리카드', 18000], ['KT Plus 우리카드', 20000], ['KT 신한 체크카드', 5000], ['olleh super DC IBK카드', 15000],
].map(([name, max], i) => ({ id: `card-${i}`, name, max }));
export const CONSULTS = [
  { id: 'internet', label: '인터넷/TV', desc: '휴대폰과 인터넷·TV를 결합하면 통신비를 더 아낄 수 있어요. 맞춤 결합 상품을 안내해 드려요.' },
  { id: 'tradein', label: '중고폰보상', desc: '쓰던 휴대폰을 상태에 따라 보상해 드려요. 보상 금액과 반납 절차를 안내해 드려요.' },
  { id: 'pointpark', label: '포인트파크 할인', desc: 'KT 포인트파크 제휴처에서 통신요금 결제 등에 포인트를 쓸 수 있어요.' },
  { id: 'bundle', label: '가족 결합할인', desc: '가족·함께 사는 분과 회선을 결합하면 요금을 더 할인받을 수 있어요.' },
];
