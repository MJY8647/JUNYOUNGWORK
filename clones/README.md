# 웹사이트 역설계 & 클론 구현

GitHub 인기 웹사이트 저장소 3개를 `tools/site-analyzer`로 분석한 뒤, 분석 결과(라우트·위젯 구성·디자인 토큰·상호작용)를 바탕으로 **빌드 도구 없이** 다시 구현했습니다.

| 원본 (MIT) | ★ | 원본 스택 | 클론 | 재현한 기능 |
|---|---:|---|---|---|
| [codewithsadee/vcard-personal-portfolio](https://github.com/codewithsadee/vcard-personal-portfolio) | 8.1k | 정적 HTML/CSS/JS | [`vcard-portfolio/`](vcard-portfolio/) | 5개 탭 SPA, 모바일 사이드바 아코디언, 후기 모달, 포트폴리오 카테고리 필터(버튼/커스텀 select), 폼 실시간 검증, 원본과 같은 5개 중단점 |
| [arthelokyo/astrowind](https://github.com/arthelokyo/astrowind) | 6.1k | Astro 7 + Tailwind 4 | [`astrowind-landing/`](astrowind-landing/) | 랜딩 위젯(Hero·Features·Content·Steps·Stats·FAQ·CTA), 드롭다운/모바일 메뉴, 깜빡임 없는 다크 모드, 스티키 헤더, 스크롤 등장, 블로그 목록·카테고리·태그·페이지네이션·상세·관련 글·링크 복사, JSON-LD |
| [alshedivat/al-folio](https://github.com/alshedivat/al-folio) (+ `al_folio_core` gem) | 16.3k | Jekyll + jekyll-scholar | [`al-folio-academic/`](al-folio-academic/) | about 레이아웃(프로필·뉴스·최근 글·선택 논문·소셜), **브라우저 BibTeX 파서**, 연도별 논문 목록, Abs/Bib 토글, 300 ms 디바운스 검색 + URL 해시 동기화 + 하이라이트, system→light→dark 3단 테마, 진행 바, 맨 위로 버튼 |

분석 리포트: [`analysis/reports/`](../analysis/reports/) · 스크린샷: [`docs/clones/`](../docs/clones/)

## 실행

설치할 것이 없습니다. 각 폴더의 `index.html`을 브라우저로 열거나:

```bash
python3 -m http.server -d clones 8000   # http://localhost:8000/astrowind-landing/
```

## 테스트

```bash
node clones/test/clones.test.js                        # 17개 동작 테스트 (Playwright + Chromium)
node clones/test/clones.test.js --screenshots docs/clones   # 스크린샷 재생성
python3 -m unittest tools/site-analyzer/test_analyze.py    # 분석기 테스트
```

## 원본과 다르게 만든 점

- **원본 코드·이미지·로고·문구를 복사하지 않았습니다.** 구조와 디자인 토큰 값만 참고했고, 이미지는 CSS 그라디언트 플레이스홀더, 인물·논문·글은 모두 가상 데이터입니다.
- 콘텐츠를 데이터 파일(`data.js`, `posts.js`)로 분리했습니다. 원본 vCard는 HTML에 하드코딩, AstroWind/al-folio는 빌드 시점 Markdown/BibTeX 처리입니다.
- 접근성 보완: vCard 모달 Esc 닫기·포커스 복귀, 내비게이션을 `innerHTML` 비교 대신 `data-nav-link` 값으로 매칭, 드롭다운 `:focus-within`, `prefers-reduced-motion` 지원.
- AstroWind의 Astro 라우트(`[...blog]/[tag]/[...page]`)는 `blog.html?tag=&page=` 쿼리스트링으로 대체했습니다.
- 스크롤 등장 효과는 JS가 실행될 때만 요소를 숨기도록(progressive enhancement) 했습니다.

## GitHub Pages 배포

`.github/workflows/clones-pages.yml`이 `main`에 사이트 파일이 바뀔 때(또는 Actions 탭에서 수동 실행) 모든 테스트를 돌린 뒤 배포합니다.
- `/` — `book-site/` (『너무 성실한 시스템』)
- `/studio/` — `studio-site/` 템플릿
- `/clones/` — 클론 3개

처음 한 번만: 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꿔 주세요.
배포 주소: `https://mjy8647.github.io/junyoungwork/`
