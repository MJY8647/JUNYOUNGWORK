// Content is data, markup is rendered by script.js (the original hard-codes it in HTML).
window.PORTFOLIO_DATA = {
  testimonials: [
    { name: "이서준", initials: "서준", hue: 200, text: "요구사항을 빠르게 이해하고, 디자인 의도를 정확하게 코드로 옮겨 주었습니다. 출시 일정도 여유 있게 맞췄어요." },
    { name: "박지민", initials: "지민", hue: 330, text: "접근성 감사를 통과하도록 컴포넌트를 전부 다듬어 주었습니다. 문서화까지 꼼꼼해서 팀 온보딩이 쉬워졌습니다." },
    { name: "최유나", initials: "유나", hue: 140, text: "이미지 파이프라인을 재설계해 페이지 로딩이 눈에 띄게 빨라졌습니다. 다시 함께 일하고 싶습니다." },
    { name: "정도윤", initials: "도윤", hue: 30, text: "작은 디테일까지 신경 쓰는 개발자입니다. 애니메이션과 인터랙션 품질이 기대 이상이었어요." }
  ],
  categories: ["All", "Web design", "Applications", "Web development"],
  projects: [
    { title: "Finance dashboard", category: "Web development", hue: 210 },
    { title: "Orbit landing", category: "Web design", hue: 260 },
    { title: "LUMI photo editor", category: "Applications", hue: 40 },
    { title: "Harbor commerce", category: "Web development", hue: 170 },
    { title: "Kite brand kit", category: "Web design", hue: 0 },
    { title: "Nova reader", category: "Applications", hue: 300 },
    { title: "Pixel docs", category: "Web development", hue: 120 },
    { title: "Atlas maps", category: "Web design", hue: 190 },
    { title: "Pulse fitness", category: "Applications", hue: 350 }
  ],
  posts: [
    { title: "디자인 토큰을 CSS 변수로 옮기는 법", category: "Design", date: "2026-10-02", hue: 45, excerpt: "색·타이포·그림자를 :root 변수로 정리하면 테마 전환이 한 줄로 끝납니다." },
    { title: "data-* 속성으로 JS 훅 분리하기", category: "Development", date: "2026-08-21", hue: 200, excerpt: "클래스는 스타일에, data 속성은 동작에. 리팩터링에 강한 마크업 규칙." },
    { title: "정적 사이트로 충분한 순간", category: "Development", date: "2026-07-10", hue: 150, excerpt: "빌드 도구 없이도 빠르고 유지보수 쉬운 사이트를 만드는 기준." },
    { title: "모바일 퍼스트 그리드 설계", category: "Design", date: "2026-05-30", hue: 280, excerpt: "580px · 768px · 1024px · 1250px 네 개의 중단점으로 레이아웃 잡기." }
  ]
};
