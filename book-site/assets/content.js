// ─────────────────────────────────────────────────────────────
//  『너무 성실한 시스템』 사이트 콘텐츠
//  출처: 예스24 도서 상세(책소개·목차·저자 소개·책 속으로·출판사 리뷰), 2026-11-14 확인.
//  "draft: true" 표시가 있는 문장은 장 제목과 출판사 소개를 바탕으로 쓴 초안입니다.
//  저자 확인 후 교체하세요.
// ─────────────────────────────────────────────────────────────
window.SITE = {
  brand: {
    name: "너무 성실한 시스템",
    author: "이산",
    short: "성실한",
    publisher: "이너피스커뮤니케이션즈",
    email: "hello@example.com",            // TODO: 실제 문의 메일로 교체
    city: "생존-안전 시스템 이론",
    coords: "244쪽 · A5 · ISBN 979-11-992869-1-7",
    founded: 2026,
  },

  book: {
    title: "너무 성실한 시스템",
    author: "이산",
    subtitle: "괴로움의 구조와 출구에 관하여",
    theory: "생존-안전 시스템 이론",
    published: "2026년 7월 15일",
    ebookPublished: "2026년 7월 24일",
    pages: 244,
    size: "148×210mm (A5)",
    isbn: "9791199286917",
    ebookIsbn: "9791199286924",
    price: "정가 20,000원",
  },

  hero: {
    eyebrow: "괴로움의 구조와 출구에 관하여 — 생존-안전 시스템 이론",
    before: "괴로움은 고장이 아니다",
    after: ["너무", "성실한", "정상 작동이다"],
    mark: 1,
  },

  manifesto: {
    note: "세 문장",
    // [text, style] — style: "slant" | "sans" | "emoji" | "br" ; ring/underline/box are pen marks
    words: [
      ["당신의", "sans"], ["괴로움은", "sans"], ["결함이", "slant ring"], ["아니라", "sans"], ["/", "br"],
      ["구조로", "slant underline"], ["이해할 수 있고,", "sans"], ["/", "br"],
      ["거기서 나오는", "sans"], ["길이", "sans box"], ["있다", "sans"],
    ],
    pointer: "이 구조로",
    // the logo wall cycles the book's key terms
    clients: ["위협 판정", "안전 규칙", "각성", "감정", "안전행동", "루프", "저항", "집착", "정체성의 결박", "운영권"],
  },

  work: {
    label: "목차",
    sideLeft: ["CONTENTS", "4부 17장", "여는 글 · 맺음말"],
    sideRight: ["DRAG TO EXPLORE", "OR USE ← → KEYS", "CLICK A CHAPTER"],
    openLabel: "장 펼쳐보기",
    // shown as cards in the curved gallery: title=card text, client=chapter name, word=big number
    projects: [
      { word: "01", client: "한 층 아래", category: "1부 · 고통의 재정의", services: "CHAPTER 1", year: "1부", hue: 222, title: "우리가 괴로움의 원인이라 부르던 것들 아래, 더 오래된 층", draft: true },
      { word: "02", client: "생존-안전 시스템", category: "1부 · 고통의 재정의", services: "CHAPTER 2", year: "1부", hue: 232, title: "위협을 먼저 감지하고, 손실을 먼저 줄이도록 진화한 장치" },
      { word: "03", client: "출구는 있다, 다만", category: "1부 · 고통의 재정의", services: "CHAPTER 3", year: "1부", hue: 242, title: "출구는 있다 — 다만 시스템을 끄는 길은 아니다", draft: true },
      { word: "04", client: "위협 판정", category: "2부 · 구조의 해부", services: "CHAPTER 4", year: "2부", hue: 352, title: "무엇이 위험한지를 정하는 첫 번째 판정", draft: true },
      { word: "05", client: "안전 규칙", category: "2부 · 구조의 해부", services: "CHAPTER 5", year: "2부", hue: 6, title: "안전을 지키기 위해 마음이 세워 둔 규칙들", draft: true },
      { word: "06", client: "각성", category: "2부 · 구조의 해부", services: "CHAPTER 6", year: "2부", hue: 18, title: "몸이 먼저 깨어나는 순간", draft: true },
      { word: "07", client: "감정", category: "2부 · 구조의 해부", services: "CHAPTER 7", year: "2부", hue: 28, title: "감정이 나빠서가 아니라, 나를 망가뜨릴 것 같아서 두렵다", draft: true },
      { word: "08", client: "안전행동", category: "2부 · 구조의 해부", services: "CHAPTER 8", year: "2부", hue: 38, title: "나를 지키려고 하는 행동들", draft: true },
      { word: "09", client: "루프", category: "2부 · 구조의 해부", services: "CHAPTER 9", year: "2부", hue: 48, title: "켜지고, 증폭되고, 다시 돌아오는 고리", draft: true },
      { word: "10", client: "왜 아는데도 안 되는가", category: "3부 · 고착의 이해", services: "CHAPTER 10", year: "3부", hue: 150, title: "앎이 괴로움을 녹이지 못하는 이유", draft: true },
      { word: "11", client: "저항", category: "3부 · 고착의 이해", services: "CHAPTER 11", year: "3부", hue: 162, title: "‘안 돼’라는 말은 지키지 않고 키운다", draft: true },
      { word: "12", client: "집착", category: "3부 · 고착의 이해", services: "CHAPTER 12", year: "3부", hue: 174, title: "알면서도 놓지 못하는 것은 몸의 안전 전략이다", draft: true },
      { word: "13", client: "정체성의 결박", category: "3부 · 고착의 이해", services: "CHAPTER 13", year: "3부", hue: 186, title: "감정이 아니라 ‘나라는 사람의 결함’과 싸울 때", draft: true },
      { word: "14", client: "운영권", category: "4부 · 운영권의 회복", services: "CHAPTER 14", year: "4부", hue: 262, title: "시스템은 끌 수 없다. 운영권은 되찾을 수 있다" },
      { word: "15", client: "4게이트", category: "4부 · 운영권의 회복", services: "CHAPTER 15", year: "4부", hue: 272, title: "운영권을 되찾는 네 개의 문", draft: true },
      { word: "16", client: "재학습", category: "4부 · 운영권의 회복", services: "CHAPTER 16", year: "4부", hue: 282, title: "시스템이 다시 배우는 과정", draft: true },
      { word: "17", client: "자유", category: "4부 · 운영권의 회복", services: "CHAPTER 17", year: "4부", hue: 292, title: "흔들림 속에서도 나를 잃지 않는 힘", draft: true },
    ],
  },

  // Interlude listed in the TOC between 13장 and 4부
  interlude: "시대라는 증폭기",

  portals: [
    { title: "책 속으로", kind: "awards", body: "본문에서 고른 문장들", dialog: "quotes" },
    { title: "저자 이산", kind: "about", body: "스무 해를 헤맨 끝에 찾은 구조", dialog: "author" },
    { title: "철학 프로그램", kind: "services", body: "준비 중 — 곧 공개됩니다", dialog: "program" },
  ],

  // 책 속으로 (예스24 상세 페이지 발췌, 쪽수 표기)
  quotes: [
    ["당신의 괴로움은 당신의 결함이 아니다. 그 괴로움은 구조적으로 이해할 수 있다. 그리고 거기서 나오는 길이 있다.", "p.9"],
    ["우리를 흔드는 것은 일어난 일이 아니다. 그 일을 읽어낸 방식이다.", "p.29"],
    ["사람이 감정을 두려워하는 진짜 이유는 감정이 나빠서가 아니다. 감정이 자기를 망가뜨릴 것 같아서다.", "p.89"],
    ["그러나 당신은 부족했던 게 아니라, 그 순간 시야가 어두웠을 뿐이다.", "p.125"],
    ["저항은 우리를 지키려 한다. 그런데 실제로 저항이 하는 일은, 지키는 것이 아니다. 키우는 것이다.", "p.136"],
    ["알면서도 놓지 못한다. 그것은 잘못된 생각이 아니라, 몸이 붙들고 있는 안전 전략이기 때문이다.", "p.154"],
    ["자유는 흔들림이 없는 상태가 아니다. 흔들림 속에서도 나를 잃지 않는 힘이다.", "p.222"],
    ["당신의 괴로움은 당신의 결함이 아니었다. 그것은 당신을 지키려 한 오래된 시스템이었다.", "p.235"],
  ],

  author: {
    name: "이산",
    paragraphs: [
      "어린 시절부터 괴로움이 많았다. 거기서 벗어나려 불교를 공부하고 오랫동안 명상을 했으며, 여러 영적 전통과 철학, 심리학을 두루 파고들었다. 그렇게 스무 해가 흘렀다.",
      "그 끝에서도 밑바닥의 괴로움은 늘 제자리에 돌아와 있었다. 그리고 바로 그 자리에서 다른 답을 보았다. 괴로움은 자신의 결함이 아니라, 인간이라면 누구나 지닌 한 구조가 작동하는 방식이라는 것.",
      "그 발견을 끝까지 따라가 인간 심리를 밑바닥부터 다시 그린 결과가 ‘생존-안전 시스템’ 이론이다. 『너무 성실한 시스템』은 그 이론을 처음으로 온전히 풀어낸 책이다.",
    ],
  },

  program: {
    title: "이산의 철학 프로그램",
    body: "책에서 다룬 생존-안전 시스템을 바탕으로 한 프로그램을 준비하고 있습니다. 소식을 받아보시려면 아래에 이메일을 남겨 주세요.",
  },

  // 국내 구매처 (판매 중 확인: 예스24 판매가 18,000원, 2026-11-14)
  stores: [
    ["예스24 · 종이책", "https://www.yes24.com/product/goods/193582466"],
    ["알라딘 · 종이책", "https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=397902920"],
    ["영풍문고 · 종이책", "https://www.ypbooks.co.kr/books/202608064858556728"],
    ["예스24 · 전자책", "https://www.yes24.com/product/goods/194488640"],
    ["교보문고 · 전자책", "https://ebook-product.kyobobook.co.kr/dig/epd/ebook/E000013336012"],
  ],

  contact: {
    lines: ["시스템은 끌 수 없다.", "그러나 운영권은", "되찾을 수 있다."],
    mark: 1,
    cta: "책 구매하기",
    secondary: "프로그램 소식 받기",
  },

  menu: {
    // [label, anchor]
    pages: [["홈", "#top"], ["세 문장", "#manifesto"], ["목차", "#work"], ["책 속으로", "#about"], ["저자", "#about"], ["구매", "#contact"]],
    servicesLabel: "PARTS",
    services: [["고통의 재정의", "1부 · 1–3장"], ["구조의 해부", "2부 · 4–9장"], ["고착의 이해", "3부 · 10–13장"], ["운영권의 회복", "4부 · 14–17장"]],
    ctaEyebrow: "PHILOSOPHY PROGRAM",
    ctaTitle: "이산의 철학 프로그램이 곧 열립니다",
    ctaButton: "소식 받기",
  },

  enquiry: {
    title: "문의하기",
    note: "프로그램 참여, 강연·북토크, 단체 구매 등 무엇이든 남겨 주세요.",
    intents: [["프로그램 참여", "철학 프로그램 오픈 알림과 참여 문의"], ["강연 · 북토크", "기관, 기업, 독서모임 초청"], ["기타 문의", "언론, 단체 구매, 협업 등"]],
    servicesLabel: "어떤 자리인가요?",
    services: ["개인", "기업 · 기관", "독서모임", "미디어", "기타"],
  },

  footer: {
    tagline: ["당신의 괴로움은 결함이 아니다.", "그것은 당신을 지키려 한 오래된 시스템이었다."],
    newsletterLabel: "철학 프로그램 소식을 메일로 받아보세요.",
    news: ["『너무 성실한 시스템』 2026년 7월 15일 출간", "전자책 2026년 7월 24일 출간", "예스24 독자 평점 9.0 / 10", "이산의 철학 프로그램 준비 중"],
    socials: [["Instagram", "#", "IG"], ["YouTube", "#", "YT"], ["Blog", "#", "B"]],  // TODO: 실제 채널 주소
  },
};
