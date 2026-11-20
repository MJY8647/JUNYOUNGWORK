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

  products: {
    ip17:   { name: "아이폰17 NEW", list: 1452000, price: 552000, color: "#d9cdf2" },
    ip17a:  { name: "아이폰17에어", list: 1584000, price: 484000, color: "#dfe9f2" },
    ip18p:  { name: "아이폰18 프로", list: 1990000, price: 1391000, color: "#6e2a33" },
    ip17p:  { name: "아이폰17프로", price: 932000, color: "#f07a2c" },
    zf8:    { name: "Z폴드8(와이드형)", price: 1378000, color: "#b9b2c9" },
    s26:    { name: "갤럭시 S26", price: 203600, color: "#9cc7d6" },
    a17:    { name: "갤럭시 A17", list: 319000, price: 0, color: "#a9d3ea", tag: "공짜폰" },
    folder: { name: "클래식 폴더", list: 205700, price: 0, color: "#1d1f22", tag: "공짜폰", folder: true },
  },

  dealers: {
    designer: {
      name: "디자이너폰팔이", short: "디자이너", color: "#b7a6dc", ink: "#4b3a7a",
      quote: "케이스 + 키링 + 그립톡 or 마그네틱 지갑. 폰꾸도 해야겠지?",
      title: "폰 고르면, 폰꾸까지 한 번에",
      chips: ["케이스", "키링", "그립톡", "마그네틱 지갑"],
      products: ["ip17", "ip17a", "ip18p"],
      cta: "3D로 폰꾸 하기", action: "studio",
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
    },
    price: {
      name: "자린고비폰팔이", short: "자린고비", color: "#9c9e6c", ink: "#4d4f22",
      quote: "삼시세끼 라면 먹고 살 거야? 싼 게 제일 중요하지!",
      title: "싼 게 제일 중요하지. 0원부터",
      products: ["a17", "folder", "s26", "ip17a", "ip17"],
      sort: true,
      cta: "최저가 상담", action: "pick",
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
    },
    allinone: {
      name: "올인원 뷰저폰팔이", short: "올인원", color: "#bdb9a8", ink: "#55513f",
      quote: "폰 사는 데 무슨 고민을 그렇게 해. 그냥 원하는 모델만 말해봐.",
      title: "원하는 모델만 골라 주세요",
      products: ["ip17", "ip17p", "zf8", "ip18p", "ip17a", "s26"],
      grid: true,
      cta: "이 모델로 상담", action: "pick",
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
