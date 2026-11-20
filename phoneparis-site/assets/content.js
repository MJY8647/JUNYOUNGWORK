/* 폰파리 딜러 스튜디오 — 모든 데이터는 이 파일 하나에서 고칩니다.
 *
 * verified: 공식 페이지·보도로 확인한 값 (source, checked 날짜 기록)
 * draft:    예시값. 실제 정책(공시지원금·추가지원금·요금제)은 매일 바뀌므로 매장 단가표로 교체하세요.
 */
window.SITE = {
  shop: {
    name: "폰파리", // TODO: 매장 이름
    tagline: "딜러 스튜디오",
    phone: "010-0000-0000", // TODO: 매장 연락처
    kakao: "", // TODO: 카카오톡 채널 링크
  },

  // 할부 수수료: 통신 3사 공통 연 5.9% (draft: 변경 시 수정)
  installmentRate: 0.059,
  contractDiscount: 0.25, // 선택약정 25%
  highPlanDays: 183,      // 고가 요금제 유지 기준(통상 6개월, 183일로 계산하는 곳이 많음) — 매장 정책 우선

  // 출고가 (verified)
  // Apple: apple.com/kr/shop/buy-iphone 2026-11-20 확인 / Samsung: 2026-10-01 인상 반영 보도, 2026-07-22 폴더블 출고가 보도
  models: [
    { id: "ip18pm", brand: "Apple", name: "iPhone 18 Pro Max", short: "18 Pro Max", tier: 1.0,
      prices: { "256GB": 2190000, "512GB": 2490000, "1TB": 3090000, "2TB": 3990000 } },
    { id: "ip18p", brand: "Apple", name: "iPhone 18 Pro", short: "18 Pro", tier: 0.95,
      prices: { "256GB": 1990000, "512GB": 2290000, "1TB": 2890000, "2TB": 3790000 } },
    { id: "ipduo", brand: "Apple", name: "iPhone Duo", short: "Duo", tier: 0.9,
      prices: { "256GB": 3290000, "512GB": 3590000, "1TB": 4190000, "2TB": 5090000 } },
    { id: "ipair", brand: "Apple", name: "iPhone Air", short: "Air", tier: 1.1,
      prices: { "256GB": 1790000, "512GB": 2090000, "1TB": 2690000 } },
    { id: "ip17", brand: "Apple", name: "iPhone 17", short: "17", tier: 1.0,
      prices: { "256GB": 1450000, "512GB": 1750000 } },
    { id: "ip17e", brand: "Apple", name: "iPhone 17e", short: "17e", tier: 1.2,
      prices: { "256GB": 1150000, "512GB": 1450000 } },
    { id: "ip16", brand: "Apple", name: "iPhone 16", short: "16", tier: 1.3,
      prices: { "128GB": 1290000 } },

    { id: "s26u", brand: "Samsung", name: "Galaxy S26 Ultra", short: "S26 울트라", tier: 1.4,
      prices: { "256GB": 1947000 } },
    { id: "s26p", brand: "Samsung", name: "Galaxy S26+", short: "S26+", tier: 1.4,
      prices: { "256GB": 1601600 } },
    { id: "s26", brand: "Samsung", name: "Galaxy S26", short: "S26", tier: 1.5,
      prices: { "256GB": 1403600 } },
    { id: "zf8u", brand: "Samsung", name: "Galaxy Z Fold8 Ultra", short: "폴드8 울트라", tier: 1.3,
      prices: { "256GB": 2577300, "512GB": 2830300, "1TB": 3451800 } },
    { id: "zf8", brand: "Samsung", name: "Galaxy Z Fold8", short: "폴드8", tier: 1.3,
      prices: { "256GB": 2278100, "512GB": 2531100 } },
    { id: "zfl8", brand: "Samsung", name: "Galaxy Z Flip8", short: "플립8", tier: 1.5,
      prices: { "256GB": 1683000, "512GB": 1936000 } },
  ],
  priceNote: "출고가 2026-11-20 기준 · Apple 공식몰, 삼성 출고가 보도 확인",

  carriers: [
    { id: "skt", name: "SKT", color: "#E5202A", factor: 1.0 },
    { id: "kt", name: "KT", color: "#111111", factor: 1.05 },
    { id: "lgu", name: "LG U+", color: "#E6007E", factor: 1.1 },
  ],

  joinTypes: [
    { id: "mnp", name: "번호이동", icon: "⇄", factor: 1.0 },
    { id: "chg", name: "기기변경", icon: "↻", factor: 0.8 },
    { id: "new", name: "신규", icon: "+", factor: 0.9 },
  ],

  // 요금제 (draft: 통신사별 실제 요금제명으로 교체)
  plans: [
    { id: "p125", price: 125000, data: "무제한", factor: 1.0 },
    { id: "p109", price: 109000, data: "무제한", factor: 0.92 },
    { id: "p95", price: 95000, data: "무제한", factor: 0.82 },
    { id: "p85", price: 85000, data: "무제한", factor: 0.72 },
    { id: "p69", price: 69000, data: "110GB", factor: 0.58 },
    { id: "p55", price: 55000, data: "12GB", factor: 0.42 },
    { id: "p37", price: 37000, data: "4GB", factor: 0.28 },
  ],

  // 공시지원금 예시 = base × 모델 tier × 요금제 factor × 통신사 factor (draft)
  subsidyBase: 400000,

  extraSupport: [0, 100000, 200000, 300000, 500000, 700000], // 추가지원금 빠른 선택 (단통법 폐지로 상한 없음)
  tradeIn: [0, 100000, 200000, 300000, 500000],              // 중고 반납 보상
  months: [0, 24, 36],                                         // 0 = 현금완납

  addons: [ // 부가서비스 (draft)
    { id: "ins", name: "폰 보험", fee: 7900, keep: 3, icon: "🛡" },
    { id: "ott", name: "OTT팩", fee: 9900, keep: 3, icon: "▶" },
    { id: "music", name: "음악", fee: 7700, keep: 2, icon: "♪" },
    { id: "cloud", name: "클라우드", fee: 3300, keep: 2, icon: "☁" },
    { id: "ring", name: "컬러링", fee: 1650, keep: 2, icon: "🔔" },
  ],

  bundles: [ // 결합 할인 월 금액 (draft)
    { id: "none", name: "없음", monthly: 0 },
    { id: "fam", name: "가족결합", monthly: 5500 },
    { id: "net", name: "인터넷", monthly: 11000 },
    { id: "both", name: "가족+인터넷", monthly: 16500 },
  ],

  cards: [0, 10000, 15000, 20000], // 제휴카드 월 할인

  checklist: [
    { id: "id", name: "신분증 원본", icon: "🪪" },
    { id: "auth", name: "본인인증", icon: "✔" },
    { id: "form", name: "가입신청서", icon: "✍" },
    { id: "pay", name: "자동이체", icon: "💳" },
    { id: "usim", name: "유심 / eSIM", icon: "▣" },
    { id: "unpaid", name: "미납·한도", icon: "₩" },
    { id: "move", name: "데이터 이전", icon: "⇪" },
    { id: "old", name: "기존폰 초기화", icon: "⟲" },
    { id: "film", name: "필름·케이스", icon: "▢" },
    { id: "alarm", name: "알림 등록", icon: "⏰" },
  ],
};
