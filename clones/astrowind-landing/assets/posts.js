// Content collection (stands in for src/data/post/*.md + frontmatter).
// `body` is trusted, author-written HTML.
window.POSTS = [
  {
    slug: "static-first-landing-pages", title: "정적 우선(Static-first) 랜딩 페이지 설계", date: "2026-10-28",
    category: "tutorials", tags: ["astro", "performance", "html"], hue: 214, author: "Editorial",
    excerpt: "빌드 시점에 HTML을 만들어 두면 서버도, 하이드레이션도 필요 없습니다. 랜딩 페이지를 정적으로 설계하는 원칙을 정리했습니다.",
    body: `<p>랜딩 페이지의 대부분은 사용자마다 달라지지 않습니다. 그렇다면 요청 시점이 아니라 <strong>빌드 시점</strong>에 HTML을 만들어 두는 편이 빠르고 저렴합니다.</p>
<h2>섹션을 위젯으로 쪼개기</h2><p>Hero, Features, Steps, Stats, FAQ, CTA처럼 재사용 가능한 위젯 단위로 나누고, 각 위젯은 props(데이터)만 받도록 만듭니다.</p>
<pre><code>&lt;Hero tagline="Free" title="..." actions={[...]} /&gt;</code></pre>
<h2>자바스크립트는 섬(island)처럼</h2><p>테마 토글, 모바일 메뉴처럼 꼭 필요한 곳에만 작은 스크립트를 붙입니다.</p>
<blockquote>기본값은 HTML, 상호작용은 선택 사항.</blockquote>`
  },
  {
    slug: "dark-mode-without-flicker", title: "깜빡임 없는 다크 모드 구현", date: "2026-10-12",
    category: "tutorials", tags: ["css", "dark-mode", "javascript"], hue: 262, author: "Editorial",
    excerpt: "페이지가 그려지기 전에 테마 클래스를 붙이는 head 인라인 스크립트, 그리고 localStorage와 시스템 설정의 우선순위.",
    body: `<p>다크 모드에서 흔한 버그는 첫 페인트 때 밝은 화면이 잠깐 보이는 현상입니다. 해결책은 <code>&lt;head&gt;</code> 안의 아주 작은 동기 스크립트입니다.</p>
<pre><code>const t = localStorage.getItem('theme');
const dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.toggle('dark', dark);</code></pre>
<h2>토큰은 CSS 변수로</h2><p><code>.dark</code> 클래스 안에서 색 토큰만 재정의하면, 나머지 스타일은 수정할 필요가 없습니다.</p>`
  },
  {
    slug: "design-tokens-from-source", title: "소스 코드에서 디자인 토큰 역추출하기", date: "2026-09-30",
    category: "design", tags: ["design-system", "css", "reverse-engineering"], hue: 190, author: "Editorial",
    excerpt: "CSS 사용자 정의 속성을 수집해 색·폰트·그림자·모션으로 분류하면, 어떤 사이트든 디자인 시스템의 뼈대가 드러납니다.",
    body: `<p>잘 만든 사이트는 대부분 <code>:root</code>에 토큰을 선언합니다. 정규식 하나로 <code>--name: value;</code> 쌍을 모으고, 이름과 값의 패턴으로 그룹을 나눌 수 있습니다.</p>
<ul><li>값에 rgb/hsl/#hex → color</li><li>이름에 shadow → shadow</li><li>이름에 font/ff → font-family</li></ul>
<p>이렇게 얻은 표가 클론 구현의 첫 번째 파일, <code>tokens.css</code>가 됩니다.</p>`
  },
  {
    slug: "seo-checklist-2026", title: "2026 정적 사이트 SEO 체크리스트", date: "2026-09-02",
    category: "guides", tags: ["seo", "html"], hue: 140, author: "Editorial",
    excerpt: "canonical, Open Graph, JSON-LD, sitemap, RSS — 템플릿이 자동으로 챙겨 주는 항목을 직접 구현할 때 빠뜨리기 쉬운 것들.",
    body: `<p>프레임워크 템플릿은 메타 태그를 대신 만들어 주지만, 직접 구현할 때는 목록이 필요합니다.</p>
<ul><li><code>&lt;link rel="canonical"&gt;</code></li><li>Open Graph / Twitter 카드</li><li>JSON-LD (WebSite, Organization, BlogPosting)</li><li>sitemap.xml, robots.txt, RSS</li></ul>`
  },
  {
    slug: "accessible-dropdown-navigation", title: "접근 가능한 드롭다운 내비게이션", date: "2026-08-15",
    category: "design", tags: ["accessibility", "css"], hue: 20, author: "Editorial",
    excerpt: ":hover만으로 여는 메뉴는 키보드 사용자를 놓칩니다. :focus-within 한 줄로 해결하는 방법.",
    body: `<p>마우스 사용자를 위한 <code>:hover</code>와 키보드 사용자를 위한 <code>:focus-within</code>을 함께 쓰면, 스크립트 없이도 드롭다운이 동작합니다.</p>
<pre><code>.nav-item:hover .dropdown,
.nav-item:focus-within .dropdown { visibility: visible; }</code></pre>`
  },
  {
    slug: "pagination-on-static-sites", title: "정적 사이트에서 페이지네이션", date: "2026-07-21",
    category: "guides", tags: ["astro", "javascript"], hue: 330, author: "Editorial",
    excerpt: "getStaticPaths의 paginate()가 하는 일을 쿼리스트링 기반 클라이언트 렌더링으로 재현합니다.",
    body: `<p>Astro는 <code>[...page].astro</code> 라우트에서 <code>paginate(posts, { pageSize })</code>로 페이지 파일을 미리 만듭니다. 빌드가 없는 클론에서는 <code>?page=2</code>를 읽어 같은 슬라이스를 계산하면 됩니다.</p>`
  },
  {
    slug: "scroll-reveal-with-intersection-observer", title: "IntersectionObserver로 스크롤 등장 효과", date: "2026-06-30",
    category: "tutorials", tags: ["javascript", "performance"], hue: 48, author: "Editorial",
    excerpt: "scroll 이벤트 대신 IntersectionObserver를 쓰면 메인 스레드를 막지 않고 섹션 등장 애니메이션을 구현할 수 있습니다.",
    body: `<p>요소가 뷰포트에 들어올 때 클래스 하나를 붙이면 끝입니다. <code>prefers-reduced-motion</code>을 존중하는 것도 잊지 마세요.</p>`
  }
];
