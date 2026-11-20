/* 폰파리 — 모든 문구·상품·가격은 이 파일에서 고칩니다.
 * 출처: 사용자 원본 영상(phoneparis-designer-studio) 속 카드 문구·가격을 옮겼습니다. 가격은 영상 기준 예시값입니다.
 */
window.SITE = {
  brand: { name: "phoneparis", note: "에펠탑 아래, 취향을 만나다." },
  contact: {
    phone: "1533-3364",          // 영상 속 상담 번호
    hours: "평일 09–18시",
    kakao: "",                   // TODO: 카카오톡 채널 링크
  },
  priceNote: "예시 가격 · 요금제·가입 유형에 따라 달라져요",

  // 스크롤 장면(카메라 위치는 world.js의 SHOTS와 같은 순서)
  chapters: [
    { id: "square", nav: "광장", title: "에펠탑 광장에\n폰 시장이 열렸다.", sub: "스크롤해서 들어가 보세요" },
    { id: "dive", nav: "하강", title: "광장 위로,\n천천히 내려가 볼까.", sub: "" },
    { id: "market", nav: "노점", title: "에펠탑 아래,\n여섯 개의 작은 가게.", sub: "" },
    { id: "designer", dealer: true },
    { id: "quick", dealer: true },
    { id: "price", dealer: true },
    { id: "safe", dealer: true },
    { id: "used", dealer: true },
    { id: "allinone", dealer: true },
    { id: "finish", nav: "마무리", title: "여섯 명 다 둘러봤다.\n이제 폰만 고르면 돼.", sub: "" },
  ],

  // 상품: price = 영상 속 1mm 기기값(공시지원금·매장지원 반영, SKT 번호이동 기준 예시)
  // list = 출고가 (아이폰17/에어/18프로는 영상, 17프로·폴드8·S26은 2026-11 출고가 보도 기준)
  products: {
    ip17:   { name: "아이폰17 NEW", list: 1452000, price: 552000, color: "#d9cdf2", colors: [["라벤더", "#d9cdf2"], ["세이지", "#c9d6c2"], ["블랙", "#2b2d30"]] },
    ip17a:  { name: "아이폰17에어", list: 1584000, price: 484000, color: "#dfe9f2", colors: [["스카이 블루", "#cfe1f2"], ["클라우드 화이트", "#f1f1ee"], ["스페이스 블랙", "#26272b"]] },
    ip18p:  { name: "아이폰18 프로", list: 1990000, price: 1391000, color: "#6e2a33", colors: [["버건디", "#6e2a33"], ["실버", "#dadbd8"], ["블랙", "#2a2b2e"]] },
    ip17p:  { name: "아이폰17프로", list: 1790000, price: 932000, color: "#f07a2c", colors: [["코스믹 오렌지", "#f07a2c"], ["실버", "#dadbd8"], ["딥 블루", "#2c3c5c"]] },
    zf8:    { name: "Z폴드8(와이드형)", list: 2278100, price: 1378000, color: "#b9b2c9", colors: [["실버 섀도", "#b9b2c9"], ["블루 섀도", "#4d5c7c"], ["제트 블랙", "#1f2023"]] },
    s26:    { name: "갤럭시 S26", list: 1403600, price: 203600, color: "#9cc7d6", colors: [["스카이 블루", "#9cc7d6"], ["코발트 바이올렛", "#7a6ab0"], ["블랙", "#25262a"]] },
    a17:    { name: "갤럭시 A17", list: 319000, price: 0, color: "#a9d3ea", tag: "공짜폰", colors: [["라이트 블루", "#a9d3ea"], ["블랙", "#25262a"]] },
    folder: { name: "클래식 폴더", list: 205700, price: 0, color: "#1d1f22", tag: "공짜폰", folder: true, colors: [["블랙", "#1d1f22"]] },
  },
  storageAdd: { "256GB": 0, "512GB": 300000 },   // 용량 올리면 출고가·기기값에 더함 (예시)

  /* ---------- 구매 프로세스 (1mm STORE v6 판매 흐름) ---------- */
  shop: {
    memberDc: 30000,           // 1mm 멤버십 즉시 할인 (v6)
    rate: 0.059,               // 할부 연 5.9% 가정
    keepDays: 183,             // 고가 요금제 유지 기준
    carriers: [
      { id: "skt", name: "SKT", add: 0 },
      { id: "kt", name: "KT", add: 40000 },
      { id: "lgu", name: "LG U+", add: 20000 },
    ],
    curs: [["skt", "SKT"], ["kt", "KT"], ["lgu", "LG U+"], ["mvno", "알뜰폰"]],
    chgAdd: 120000,            // 기기변경이면 번호이동보다 기기값 + (예시)
    bundleDc: 11000,           // 결합 유지 시 월 할인 (예시)
    tiers: [
      { id: "low", label: "적게", sub: "~7GB", fee: { skt: 49000, kt: 47000, lgu: 47000 }, mvno: 16500 },
      { id: "mid", label: "보통", sub: "~30GB", fee: { skt: 62000, kt: 61000, lgu: 59000 }, mvno: 29000 },
      { id: "high", label: "많이", sub: "무제한", fee: { skt: 89000, kt: 90000, lgu: 85000 }, mvno: 39000 },
    ],
    selRate: 0.25,             // 선택약정 25%
    selSupportRate: 0.12,      // 선택약정일 때 매장지원 (출고가 대비, 예시)
    months: [0, 12, 24, 36],
    ship: [
      { id: "quick", icon: "🛵", name: "퀵", sub: "오늘 도착" },
      { id: "parcel", icon: "🚚", name: "택배", sub: "1~2일 · 무료" },
      { id: "store", icon: "🏪", name: "방문 수령", sub: "준비되면 문자" },
    ],
    agree: [
      { id: "a1", t: "개봉·개통 후 단순 변심 반품 불가", d: "불량은 받은 날부터 7일 안에 교환" },
      { id: "a2", t: "폰을 받은 뒤 개통", d: "개통 시간에만 처리돼요" },
      { id: "a3", t: "주문 내용·배송 조건 확인" },
      { id: "a4", t: "개인정보 수집·이용 동의", d: "이름·연락처·주소" },
    ],
    usedGrades: [
      { id: "S", name: "S급", d: "사용감 거의 없음", rate: 0.62 },
      { id: "U", name: "미개봉급", d: "개봉만 한 수준", rate: 0.74 },
    ],
    usedBattery: [{ id: "85", name: "85% 이상", add: 0 }, { id: "90", name: "90% 이상", add: 40000 }],
    usedChecks: ["IMEI 분실·도난 조회", "통화·카메라·Wi-Fi", "충전·배터리 측정", "초기화·계정 잠금 해제"],
    safeItems: [
      { id: "case", icon: "▣", name: "강화 케이스", price: 19000 },
      { id: "film", icon: "▭", name: "강화 필름", price: 15000 },
      { id: "care", icon: "✚", name: "휴대폰 보험", monthly: 5900 },
    ],
    safePromises: ["미개봉 정품", "KT 공식인증 대리점", "의무 부가서비스 없음", "할인 즉시 반영"],
    quickSpeed: [
      { id: "now", icon: "🛵", name: "오늘 퀵", sub: "평일 16시 전 신청" },
      { id: "visit", icon: "🏪", name: "방문 수령", sub: "바로 가져가기" },
      { id: "parcel", icon: "🚚", name: "택배", sub: "1일 · 제주 2일" },
    ],
    quickOpen: [
      { id: "after", name: "받고 나서 개통", sub: "쓰던 폰 그대로" },
      { id: "before", name: "미리 개통", sub: "받자마자 바로" },
    ],
    priceFocus: [
      { id: "monthly", icon: "📅", name: "매달 최저", sub: "월 납부금 순" },
      { id: "today", icon: "0", name: "오늘 0원", sub: "할부로 시작" },
      { id: "total", icon: "Σ", name: "2년 총액 최저", sub: "다 더해서" },
    ],
  },

  dealers: {
    designer: {
      name: "디자이너폰팔이", short: "디자이너", color: "#b7a6dc", ink: "#4b3a7a",
      quote: "케이스 + 키링 + 그립톡 or 마그네틱 지갑. 폰꾸도 해야겠지?",
      title: "폰 고르면, 폰꾸까지 한 번에",
      chips: ["케이스", "키링", "그립톡", "마그네틱 지갑"],
      products: ["ip17", "ip17a", "ip18p"],
      cta: "3D로 폰꾸 하기", action: "studio",
      points: ["폰꾸 세트", "3D로 미리 보기", "폰+케이스 한 번에"],
      pitch: "폰꾸 세트, 같이 골라 봐.",
    },
    quick: {
      name: "퀵퀵이폰팔이", short: "퀵퀵이", color: "#f08a2c", ink: "#8a3c00",
      quote: "폰은 알아서 잘 고를 거잖아? 근데 받는 건 지금 바로!",
      title: "고르는 건 당신이, 보내는 건 지금 바로",
      steps: [
        { t: "급하면 퀵배송·방문 수령", d: "카카오톡 채널이나 1533-3364로 말씀하시면 퀵으로 보내드려요." },
        { t: "평일 16시까지 신청하면 당일 발송", d: "신청하고 해피콜까지 끝나면 그날 바로 출발해요." },
        { t: "미개봉 새 제품 그대로", d: "제조사 미개봉 단말기와 사은품을 함께 포장해요. 택배는 제주 외 1일 이내, 제주 2일." },
        { t: "받고 나서 개통도 OK", d: "배송 후 개통을 원하면 미리 요청해 주세요. 기기변경이면 개통 후에도 쓰던 폰을 계속 쓸 수 있어요." },
      ],
      cta: "퀵으로 받기", action: "pick",
      points: ["오늘 퀵 도착", "16시 전 당일 발송", "받고 나서 개통"],
      pitch: "언제, 어떻게 받을래?",
      products: ["ip17", "ip17a", "ip17p", "ip18p", "s26", "zf8"],
    },
    price: {
      name: "자린고비폰팔이", short: "자린고비", color: "#9c9e6c", ink: "#4d4f22",
      quote: "삼시세끼 라면 먹고 살 거야? 싼 게 제일 중요하지!",
      title: "싼 게 제일 중요하지. 0원부터",
      products: ["a17", "folder", "s26", "ip17a", "ip17"],
      sort: true,
      cta: "최저가 상담", action: "pick",
      points: ["0원폰", "최저 조건 자동 비교", "2년 총액까지"],
      pitch: "뭐가 제일 중요해? 돈 얘기만 하자.",
    },
    safe: {
      name: "세이프티폰팔이", short: "세이프티", color: "#3f4f7d", ink: "#1f2a4d",
      quote: "케어는 나한테 맡겨!",
      title: "개통 전부터 개통 후까지, 케어는 맡겨",
      steps: [
        { t: "미개봉 정품만", d: "제조사에서 받은 미개봉 새 제품으로 보내드려요." },
        { t: "KT 공식인증 대리점", d: "사전승낙서·온라인 공식 인증서를 받은 공식 판매점이에요." },
        { t: "의무 부가서비스·필수 요금제 없음", d: "원하는 요금제로 가입할 수 있어요." },
        { t: "할인은 개통 즉시 반영", d: "공식신청서에 안 보여도 걱정 마세요. 개통 후 마이케이티 앱에서 확인돼요." },
        { t: "막히면 1:1로", d: "실명 인증·요금제 선택에서 막히면 1533-3364(평일 09–18시)로 바로 도와드려요." },
      ],
      combo: ["강화 케이스", "강화 필름", "휴대폰 보험"],
      cta: "안심 상담", action: "consult",
      points: ["미개봉 정품", "보호 3종 세트", "공식인증 대리점"],
      pitch: "지킬 거 골라. 약속은 도장으로.",
      products: ["ip17", "ip17a", "ip17p", "ip18p", "s26", "zf8"],
    },
    used: {
      name: "중고폰팔이", short: "중고폰", color: "#9c3a55", ink: "#5e1529",
      quote: "진짜 S급! 미개봉 급! 우리 중고폰 관리 잘하는 거 알지?",
      title: "관리 잘된 중고폰, 상담으로 골라 드려요",
      grades: [
        { id: "S", name: "S급", d: "사용감 거의 없음" },
        { id: "U", name: "미개봉급", d: "개봉만 한 수준" },
      ],
      note: "재고는 수시로 바뀌어서 상담으로 안내해요.",
      cta: "중고폰으로 상담 받기", action: "consult",
      points: ["S급·미개봉급", "배터리 보장", "4단계 검수"],
      pitch: "등급이랑 배터리, 네가 정해.",
      products: ["ip17", "ip17a", "ip17p", "ip18p", "s26", "zf8"],
    },
    allinone: {
      name: "올인원 뷰저폰팔이", short: "올인원", color: "#bdb9a8", ink: "#55513f",
      quote: "폰 사는 데 무슨 고민을 그렇게 해. 그냥 원하는 모델만 말해봐.",
      title: "원하는 모델만 골라 주세요",
      products: ["ip17", "ip17p", "zf8", "ip18p", "ip17a", "s26"],
      grid: true,
      cta: "이 모델로 상담", action: "pick",
      points: ["모델만 고르면 끝", "상담 질문 생략", "최저 조건 자동"],
      pitch: "나머진 내가 알아서 할게. 괜찮지?",
    },
  },

  // 3D 폰꾸 작업실
  studio: {
    devices: [
      { id: "ip17", name: "아이폰17", w: 1.0, cam: "dual" },
      { id: "ip18p", name: "아이폰18 프로", w: 1.0, cam: "triple" },
      { id: "s26", name: "갤럭시 S26", w: 0.97, cam: "vertical" },
    ],
    colors: [
      { id: "silver", name: "실버", c: "#d5d5d1" },
      { id: "black", name: "블랙", c: "#353638" },
      { id: "lav", name: "라벤더", c: "#cfc3ea" },
    ],
    cases: [
      { id: "clear", name: "클리어", c: "#e8ecef", price: 19000, clear: true },
      { id: "cobalt", name: "코발트", c: "#2335e8", price: 24000 },
      { id: "tangerine", name: "탠저린", c: "#ff641e", price: 24000 },
      { id: "chrome", name: "크롬", c: "#bfc1c4", price: 29000, metal: true },
    ],
    keyrings: [
      { id: "none", name: "없음", price: 0 },
      { id: "ball", name: "오렌지 볼", c: "#ff6a23", price: 9000 },
      { id: "chain", name: "실버 체인", c: "#c5c7cf", price: 12000 },
      { id: "loop", name: "블루 루프", c: "#3b43ef", price: 9000 },
    ],
    backs: [
      { id: "none", name: "없음", price: 0 },
      { id: "grip", name: "그립톡", c: "#243bea", price: 14000 },
      { id: "wallet", name: "마그네틱 지갑", c: "#ff6a23", price: 18000 },
    ],
  },
};
