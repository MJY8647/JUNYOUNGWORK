# site-analyzer

웹사이트 저장소를 소스 코드 수준에서 역설계하는 Python 스크립트 (표준 라이브러리만 사용).

```bash
python3 tools/site-analyzer/analyze.py https://github.com/owner/repo -o analysis/reports
python3 tools/site-analyzer/analyze.py owner/repo
python3 tools/site-analyzer/analyze.py ./local/folder
```

`<name>.md`(사람이 읽는 리포트)와 `<name>.json`(원시 데이터)을 만듭니다.

| 항목 | 추출 방법 |
|---|---|
| 프레임워크·빌드 | `astro.config`, `next.config`, `Gemfile`, `_config.yml`, `package.json` 의존성 |
| 스타일링 | Tailwind/Sass/Bootstrap 흔적, `_config.yml`의 `style_engine` |
| 호스팅 | `vercel.json`, `netlify.toml`, `wrangler`, `Dockerfile`, 배포 워크플로 |
| 언어 비율·디렉터리 지도 | 확장자별 파일/줄 수, 2단계 트리 |
| 라우트 | Astro/Next 파일 라우팅(`[slug]`→`:slug`, `[...x]`→`*x`), Jekyll `permalink`, 정적 HTML의 `data-page` 섹션 |
| 컴포넌트 | `components/`·`layouts/`·`_includes/` 그룹별 목록 |
| 디자인 토큰 | CSS 사용자 정의 속성 → color / font / size / shadow / motion / gradient 분류, Google Fonts, Tailwind `@theme`, 다크 모드 규칙 |
| 동작 | `addEventListener` 이벤트, `data-*` 훅, localStorage·IntersectionObserver·View Transitions 등 브라우저 API |
| SEO·외부 리소스 | OG/Twitter/JSON-LD/canonical, sitemap/RSS/robots, 외부 스크립트·스타일 호스트 |
| 콘텐츠 | Markdown 컬렉션, YAML/JSON/BibTeX 데이터 파일 |
| 재구축 설계도 | 위 결과로 생성한 단계별 클론 구현 체크리스트 |

테마가 gem/npm 패키지 안에 있는 경우(예: al-folio의 `al_folio_core`) 경고를 표시하므로, 해당 패키지를 내려받아 같은 스크립트로 한 번 더 분석하면 됩니다.

한계: 정적 소스 분석이라 런타임에만 생성되는 마크업, 원격 테마, 빌드 플러그인의 출력은 보이지 않습니다.
