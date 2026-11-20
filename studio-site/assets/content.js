// ─────────────────────────────────────────────────────────────
//  All copy and data for the site lives here. Replace the
//  placeholder values (brand, projects, contact) with your own.
// ─────────────────────────────────────────────────────────────
window.SITE = {
  brand: {
    name: "OURS STUDIO",            // shown in nav, footer, title
    short: "OURS",                  // short word inside the hero cover
    email: "hello@example.com",
    city: "Seoul, Korea",
    coords: "37.5665° N, 126.9780° E",
    founded: 2021,
  },

  hero: {
    eyebrow: "브랜드와 웹을 만드는 디자인 스튜디오",
    // headline is split around the ✦; `mark` is underlined with a pen stroke
    before: "당신의 이야기",
    after: ["제대로", "디자인합니다"],
    mark: 0,
  },

  manifesto: {
    note: "우리는 만듭니다",
    // [text, style] — style: "slant" | "sans" | "emoji" ; ring/underline/box are pen marks
    words: [
      ["선명한", "slant ring"], ["🎨", "emoji"], ["디자인을", "sans"], ["/", "br"],
      ["진심으로", "sans"], ["🚀", "emoji"], ["성장하는", "slant underline"], ["브랜드에게", "sans box"],
    ],
    pointer: "이런 곳들처럼",
    clients: ["NORTHWIND", "Halo&Co", "PARALLEL", "mintcake", "OAKROOM", "Lumen", "BRIGHTLY", "tandem", "Kiln", "SOLACE"],
  },

  work: {
    label: "작업",
    since: "2021–2026",
    projects: [
      { title: "산책하듯 고르는 차(茶) 구독 서비스", client: "Leaf & Co", category: "식음료", services: "브랜드 & 웹", year: 2026, hue: 152, word: "leaf" },
      { title: "반도체 스타트업의 첫 번째 정체성", client: "Siliq", category: "하이테크", services: "브랜드", year: 2026, hue: 230, word: "siliq" },
      { title: "건축 사무소의 포트폴리오를 한 장의 벽으로", client: "Plan B Arch", category: "건축", services: "웹", year: 2025, hue: 28, word: "plan b" },
      { title: "아이들을 위한 코딩 로봇 브랜딩", client: "Botty", category: "에듀테크", services: "브랜드 & 웹", year: 2025, hue: 48, word: "botty" },
      { title: "동네 서점을 위한 온라인 큐레이션", client: "Pagewalk", category: "커머스", services: "웹", year: 2025, hue: 350, word: "page" },
      { title: "의료비 소액 대출을 안심되게", client: "Mendy", category: "핀테크", services: "브랜드", year: 2024, hue: 268, word: "mendy" },
      { title: "3D로 미리 보는 가구 쇼룸", client: "Rumi", category: "3D 커머스", services: "브랜드 & 웹", year: 2024, hue: 190, word: "rumi" },
      { title: "한옥 스테이의 향을 담은 아이덴티티", client: "Dameum", category: "호스피탈리티", services: "브랜드 & 웹", year: 2024, hue: 12, word: "dameum" },
      { title: "지역 관광을 기념품으로 그리다", client: "Busan Trip", category: "관광", services: "인쇄물", year: 2023, hue: 205, word: "busan" },
      { title: "한 접시로 보여주는 코스 다이닝", client: "Soban", category: "다이닝", services: "웹", year: 2023, hue: 330, word: "soban" },
    ],
  },

  portals: [
    { title: "수상", kind: "awards", body: "국내외 디자인 어워드 수상과 소개 기록" },
    { title: "스튜디오", kind: "about", body: "누가, 어떻게 일하는지" },
    { title: "서비스", kind: "services", body: "브랜드 · 웹 · 프로덕트 · 모션" },
  ],

  contact: {
    lines: ["함께 방향을", "잡아 드릴게요,", "선장님."],
    mark: 1,
    cta: "프로젝트 시작하기",
  },

  menu: {
    pages: ["홈", "작업", "서비스", "수상", "스튜디오", "인사이트"],
    services: [["Launch", "새로 시작할 때"], ["Evolve", "지금을 넘어설 때"], ["Scale", "잘 되는 걸 키울 때"]],
  },

  enquiry: {
    intents: [["프로젝트 의뢰", "새 작업, 브리프, 견적 요청"], ["채용 지원", "공개 채용, 인턴, 자유 지원"], ["기타 문의", "언론, 강연, 협업 등"]],
    services: ["웹사이트", "브랜드", "UI/UX", "3D", "기타"],
  },

  footer: {
    tagline: ["선명한 디자인을,", "진심으로 성장하는 브랜드에게"],
    news: ["새 케이스 스터디: Leaf & Co", "스튜디오가 새 공간으로 이사했어요", "2026 하반기 프로젝트 예약 중"],
    socials: [["Instagram", "#", "IG"], ["LinkedIn", "#", "in"], ["X", "#", "X"]],  // [name, url, short label]
  },
};
