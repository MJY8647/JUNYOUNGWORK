# Site analysis — phoneparis-designer-studio.junyeong0111.chatgpt.site (live site, 2026-11-20)

Source: static fetch of HTML/CSS/JS + 320 scroll frames (`world/000–319.webp`, 390×740), viewed as a contact sheet.
**Ownership:** 사용자 본인 계정의 사이트이며, 프레임은 사용자가 제공한 원본 영상에서 뽑은 것. 재구성 시 대체 이미지로만 10장 재사용.

## Stack
| Layer | Finding |
|---|---|
| Framework | 바닐라 ES 모듈 (`app.js`, `world.js`, `scene.js`, `catalog.js`, `tour-navigation.js`) |
| 월드 | **3D 아님** — 영상 6.65s–44.4s를 320장 webp로 잘라 스크롤에 맞춰 캔버스에 그림 |
| 내비게이션 | 휠/터치 한 번 = 한 장면(StepGate, 1.25s 쿨다운), 9개 정지점 |
| 3D | `scene.js` three.js — 디자이너 작업실의 절차적 폰만 |
| 폰트 | Noto Sans KR, 로고 Arial |

## 영상 흐름 (프레임 기준)
000–016 광장 전경(격자 타일, 중앙 에펠탑) → 024–040 탑 위에서 하강, 파스텔 노점·군중 → 048 모션 블러 전환 → 056 디자이너(라벤더 원기둥) → 096 퀵퀵이(주황 박스+카트) → 136 자린고비(카키 원뿔) → 176 세이프티(남색 박스) → 216 중고폰(버건디 기둥) → 256 올인원(회색 달걀) → 296–319 탑 아래 "여섯 명 다 둘러봤다. 이제 폰만 고르면 돼."
각 폰팔이: 하단 자막 → 흰 카드(배지, 인용, 제목, 상품/단계).

## Design tokens
--ink #202529 · --muted #737d86 · --line #dce1e4 · --blue #254bf1 · --orange #ff6a23, 카드 흰색 r≈18.

## Rebuild plan
| Original | Ours | Why |
|---|---|---|
| 320장 프레임 스크럽 | three.js 실시간 장면(탑 1,708 철골, 군중 2,600, 노점 240, 캐릭터 6) | 요청: 카메라·피사체·모션을 실제로 구현 |
| StepGate 휠 제어 | CSS scroll-snap(장면=100vh) + Catmull-Rom 카메라 곡선 | 단순, 키보드·터치 기본 동작 |
| 영상 속 정지 카드 | HTML 카드 + 탭 흐름(6종) | 글 최소화, 클릭으로 진행 |
| 이미지 속 자막 | 캐릭터 머리 위 말풍선(3D 위치 추적) | 장면과 함께 움직임 |
| 디자이너 3D | 새 절차적 폰(케이스 테두리·키링 흔들림·그립톡/지갑) | 기능 유지·개선 |
| — | WebGL 없으면 원본 프레임 10장으로 대체 | 저사양 대비 |

## v2 (2026-11-20): 디테일 + 구매 흐름
- 캐릭터: 둥근 모서리(Extrude bevel)·회전체(Lathe) 몸통, 광택 눈동자, 캡슐 팔·공 손, 폰팔이별 소품(손수레·0원 가격표·방패·S급 팻말·가슴 선반), 부스 이름표, 그림자(PC).
- 탑: 면마다 2칸 X + 가운데 기둥, 3겹 아치 지그재그, 1층 장식 아치 띠, 전망대 위 구조물·랜턴.
- 구매: 1mm STORE v6(https://claude.ai/artifact/1LAgZDaXt9FHoub7qyKS7Y)의 판매 프로세스와 UX(미션 바, 대사창+말풍선, 원목 테이블 위 물건, 할인 카드, 할부 동전, 도장+서명, 영수증)를 폰팔이별 셀링포인트 단계와 결합.
