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

  /* ---------- 구매 프로세스 (1mm STORE v6 판매 흐름) ---------- */
  // 상품·지원금·요금제는 catalog.js (1mm STORE v6 데이터)
  shop: {
    keepDays: 183,             // 고가 요금제 유지 기준
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
      points: ["폰꾸 세트", "3D로 미리 보기", "폰+케이스 한 번에"],
      pitch: "폰꾸 세트, 같이 골라 봐.",
    },
    quick: {
      name: "퀵퀵이폰팔이", short: "퀵퀵이", color: "#f08a2c", ink: "#8a3c00",
      quote: "폰은 알아서 잘 고를 거잖아? 근데 받는 건 지금 바로!",
      title: "고르는 건 당신이, 보내는 건 지금 바로",
      points: ["오늘 퀵 도착", "16시 전 당일 발송", "받고 나서 개통"],
      pitch: "언제, 어떻게 받을래?",
    },
    price: {
      name: "자린고비폰팔이", short: "자린고비", color: "#9c9e6c", ink: "#4d4f22",
      quote: "삼시세끼 라면 먹고 살 거야? 싼 게 제일 중요하지!",
      title: "싼 게 제일 중요하지. 0원부터",
      points: ["0원폰", "최저 조건 자동 비교", "2년 총액까지"],
      pitch: "뭐가 제일 중요해? 돈 얘기만 하자.",
    },
    safe: {
      name: "세이프티폰팔이", short: "세이프티", color: "#3f4f7d", ink: "#1f2a4d",
      quote: "케어는 나한테 맡겨!",
      title: "개통 전부터 개통 후까지, 케어는 맡겨",
      points: ["미개봉 정품", "보호 3종 세트", "공식인증 대리점"],
      pitch: "지킬 거 골라. 약속은 도장으로.",
    },
    used: {
      name: "중고폰팔이", short: "중고폰", color: "#9c3a55", ink: "#5e1529",
      quote: "진짜 S급! 미개봉 급! 우리 중고폰 관리 잘하는 거 알지?",
      title: "관리 잘된 중고폰, 상담으로 골라 드려요",
      points: ["S급·미개봉급", "배터리 보장", "4단계 검수"],
      pitch: "등급이랑 배터리, 네가 정해.",
    },
    allinone: {
      name: "올인원 뷰저폰팔이", short: "올인원", color: "#bdb9a8", ink: "#55513f",
      quote: "폰 사는 데 무슨 고민을 그렇게 해. 그냥 원하는 모델만 말해봐.",
      title: "원하는 모델만 골라 주세요",
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
