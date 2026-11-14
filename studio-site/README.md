# studio-site

[bunqlabs.com](https://bunqlabs.com/)의 구성과 인터랙션을 역설계해 **우리 사이트용으로 새로 만든** 원페이지 스튜디오 사이트입니다.
분석 내용: [`analysis/reports/bunqlabs.com.md`](../analysis/reports/bunqlabs.com.md) · 스크린샷: [`docs/studio/`](../docs/studio/)

> 원본은 오픈소스가 아니므로 코드·이미지·3D 모델·영상·로고·문구는 하나도 가져오지 않았습니다.
> 섹션 구성, 인터랙션 방식, 디자인 시스템의 구조만 참고해 처음부터 작성했습니다.

## 실행

빌드 없이 `index.html`을 브라우저로 열면 됩니다. 의존성은 Google Fonts뿐입니다(오프라인이면 시스템 글꼴로 대체).

```bash
python3 -m http.server -d studio-site 8080   # http://localhost:8080
node studio-site/test/site.test.js           # 동작 테스트 9개
```

## 내 것으로 바꾸기

| 바꿀 것 | 위치 |
|---|---|
| 회사명, 이메일, 위치, 모든 문구, 프로젝트 목록, 고객사 이름 | `assets/content.js` 한 파일 |
| 색·글꼴·간격 | `assets/styles.css` 맨 위 `:root` 토큰 (`--accent`, `--font-sans` 등) |
| 로고 | `assets/app.js`의 `LOGO` SVG |
| 프로젝트 썸네일 | 지금은 CSS 그라디언트(`hue`, `word`). 실제 이미지는 `.card__art`에 `<img>`를 넣으면 됨 |
| 문의 폼 전송 | 지금은 방문자의 메일 앱을 엽니다(`mailto:`). Formspree·자체 API 등이 있으면 `enquiry()`의 submit 부분 교체 |
| 뉴스레터 | 데모 메시지만 표시. 메일 서비스(Stibee, Mailchimp 등)와 연결 필요 |

## 원본 기법 → 이 구현

| 원본 (bunqlabs.com) | 여기서 |
|---|---|
| 로딩 화면 (퍼센트·로고·LOADING) | 글꼴 로딩과 연동한 카운터, 끝나면 페이드 |
| 떠 있는 알약형 내비 | 같은 구성, 아래로 스크롤 시 숨김/위로 스크롤 시 표시 |
| Three.js 3D 산 + 표지 + 궤도 | Canvas 2D 절차적 산(노이즈), 산꼭대기 높이를 계산해 표지를 정확히 올림, 궤도 위를 도는 ✦ |
| 산이 점구름으로 흩어지는 전환 | 같은 지형 함수로 만든 점구름이 스크롤에 맞춰 모임 |
| 펜으로 그린 동그라미·밑줄·선택 박스·손글씨 | SVG 선 그리기 애니메이션 + Nanum Pen Script (한글 지원) |
| 로고 월 순환 (GSAP ScrambleText) | 자체 스크램블 텍스트 |
| WebGL 곡면 작업 갤러리 | CSS 3D 원통 배치, 드래그(관성)·←→ 키·가로 스와이프, 무한 순환, "드래그" 커서 |
| 포털 카드 3개 (3D 영상) | 그라디언트 + CSS 애니메이션 도형 |
| 메뉴 오버레이 + System/Light/Dark | 같은 구성, 테마는 저장되고 시스템 설정 변경을 따라감 |
| 3단계 문의 폼 | 단계별 검증, 문의 유형 라디오, 분야 칩, 완료 후 10초 카운트다운 |

접근성: 키보드로 모든 기능 사용 가능, 메뉴 포커스 가두기·Esc 닫기, `prefers-reduced-motion`이면 애니메이션 생략.
