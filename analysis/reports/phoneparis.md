# Site analysis — phoneparis-designer-studio.junyeong0111.chatgpt.site (live site, 2026-11-20)

Source: static fetch (`scripts/recon.py`) through the session proxy.
**License:** proprietary (ChatGPT Sites). Nothing copied.

## 결과: 로그인 벽 (401)

사이트는 ChatGPT 로그인 뒤에 있어 공개 요청에는 "Log in to access" 안내 페이지만 돌아옵니다
(`<title>Sign in required</title>`, `body.login-required`). 실제 화면·구성·모션은 확인할 수 없었습니다.
recon.md의 색상 토큰(#010002 / #fff 등)은 로그인 안내 페이지의 것이라 원본 디자인과 무관합니다.

| Layer | Finding |
|---|---|
| Framework | React (ChatGPT Sites 호스팅) — 로그인 페이지 기준 |
| 3D / Animation | 확인 불가 |
| Fonts | system-ui (로그인 페이지) |

## 대신 사용한 근거

- 사이트 이름 "PhoneParis Designer Studio" → 휴대폰 판매점(딜러)용 견적·시세표 제작 도구로 해석
- 사용자 요청: 딜러가 하는 모든 항목, 글 최소화, 클릭으로 넘어가는 방식, 정보 축약
- 같은 저장소 `claude/busy-noether-wb5p2s` 브랜치의 1mm 모바일 PRODUCT.md (183일 요금제 변경 알림표, 모델 우선 흐름)

## 딜러 업무 → 화면 매핑

| 딜러가 하는 일 | 스튜디오 화면 | 입력 방식 |
|---|---|---|
| 기종 상담 | 견적 1 기종 | 타일 탭 → 자동 다음 |
| 용량 / 출고가 | 견적 2 용량 | 타일 탭 |
| 통신사 · 번이/기변/신규 | 견적 3 개통 | 타일 2개 탭 |
| 고가 요금제 / 6개월 후 변경 | 견적 4·5 요금·변경 | 타일 탭 |
| 공시 vs 선약 비교, 추가지원금 | 견적 6 지원 | 자동 유리 표시, 칩, ± |
| 할부·현금완납, 중고 반납 | 견적 7 결제 | 칩, ± |
| 부가서비스·결합·제휴카드 | 견적 8 혜택 | 토글 타일, 칩 |
| 견적서·카톡 안내 | 견적 9 결과 | 큰 숫자, 복사 버튼 |
| 개통 서류·유심·데이터 이전 | 견적 10 체크 | 토글 + 진행률 |
| 매장 시세표(카톡/밴드 게시) | 시세표 | 칩 선택 → PNG |
| 요금제 변경일·부가 해지·약정 만료 | 사후관리 | 날짜 1개 → 타임라인, .ics |

## Rebuild plan

| Original technique | Our implementation | Why |
|---|---|---|
| React SPA (추정) | 무빌드 HTML/CSS/JS, `content.js` 한 파일에 데이터 | 매장에서 바로 열고 수정 |
| — | 하단 고정 요약 바(할부원금·월 납부) | 단계 이동 중에도 숫자 확인 |
| — | Canvas 시세표 → PNG | 외부 라이브러리 없이 이미지 저장 |
| — | localStorage 상태 유지 | 새로고침해도 상담 이어서 |
