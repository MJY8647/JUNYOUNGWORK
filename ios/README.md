# LUMI iOS

기존 안드로이드 LUMI 개발판의 기능을 SwiftUI·UIKit·Photos·AVFoundation으로 옮긴 iPhone/iPad 프로젝트입니다. iOS 16 이상을 대상으로 합니다. 결제·광고·워터마크·앱 서버가 없으며, 메이투 전체 기능 완성본은 아닙니다.

## 옮긴 기능

| 안드로이드 기능 | iOS 코드 |
|---|---|
| 차콜·라임 UI, 사진 중심 편집 화면 | SwiftUI 홈·편집·영상 화면 |
| 사진 선택 | iOS 시스템 사진 선택기, EXIF 방향 적용, 최대 4096px/약 600만 픽셀 |
| 밝기·대비·채도·색온도·하이라이트·비네트 | 동일한 Float 기반 픽셀 수식 |
| 피부 스무딩 | 피부색 마스크와 경계 보존 양방향 필터 |
| 잡티·부분 형태 브러시 | 주변색 혼합 및 국소 픽셀 변형, 사진당 최대 100회 |
| 선라이트·쿨 에어·필름·모노 | 동일한 프리셋과 강도 조절 |
| 회전·반전·비율 자르기 | 90도 회전, 좌우 반전, 중앙 1:1·4:5·16:9 자르기 |
| 문구·화이트 프레임 | 최대 60자 문구와 테두리 |
| 확대·원본 비교·이력 | 두 손가락 확대, 길게 눌러 비교, 30단계 되돌리기/다시 실행 |
| 콜라주 | 2~9장, 그리드·세로·가로 스트립 |
| 영상 미리보기·자르기·음소거 | AVPlayer와 AVMutableComposition, MP4 내보내기 |
| 갤러리 저장 | 사진 앱에 새 JPEG(품질 97) 또는 MP4 저장 |

위 표는 **코드 구현 범위**입니다. Apple SDK 전체 빌드, 시뮬레이터 실행, 실제 iPhone 설치·사진/영상 저장은 아직 검증하지 않았습니다. 현재 Linux 환경에서는 Xcode를 실행할 수 없습니다.

## Mac에서 열고 본인 아이폰에 설치하기

1. Mac에 Apple의 Xcode를 설치하고 한 번 실행해 추가 구성 요소 설치를 끝냅니다. Xcode 16 이상을 권장합니다.
2. 이 저장소를 다운로드하거나 `git clone https://github.com/MJY8647/JUNYOUNGWORK.git`로 받습니다.
3. `ios/Lumi.xcodeproj`를 Xcode로 엽니다. 상단 Scheme은 **Lumi**를 선택합니다.
4. 왼쪽 프로젝트 → **TARGETS → Lumi → Signing & Capabilities**에서 **Automatically manage signing**을 켜고 본인 **Team**을 선택합니다.
5. 계정이 없으면 **Xcode → Settings → Accounts**에서 본인 Apple 계정을 추가합니다. 비밀번호·인증번호는 Xcode/Apple의 화면에 직접 입력하고 채팅에 보내지 않습니다.
6. Bundle Identifier가 이미 사용 중이라고 나오면 본인만의 값으로 바꿉니다. 예: `com.mjy8647.lumi.personal`.
7. 아이폰을 Mac에 연결하고 기기 신뢰를 승인합니다. 필요한 경우 아이폰 **설정 → 개인정보 보호 및 보안 → 개발자 모드**를 켭니다.
8. Xcode 상단 실행 기기를 본인 아이폰으로 선택하고 **▶ Run**을 누릅니다.

무료 Apple 계정의 **Personal Team**으로 본인 기기 테스트를 시작할 수 있습니다. 무료 프로비저닝은 일반적으로 7일 후 만료되므로 다시 빌드·설치해야 하며, 등록 기기·앱 수 제한도 있습니다. 최신 조건은 Xcode와 Apple 계정 안내를 확인하세요.

**APK처럼 파일 하나를 아무 아이폰에나 전달해 설치할 수는 없습니다.** 주변 사람들에게 지속적으로 배포하려면 TestFlight 또는 등록 기기용 Ad Hoc 등 Apple이 지원하는 서명·배포 절차가 필요합니다. Apple Developer Program은 Google Play 계정과 별도이며, 유료 멤버십은 연간 갱신 방식입니다. 여기에는 Apple 계정·배포용 인증서·프로비저닝 파일을 포함하지 않습니다.

## Mac에서 빌드와 테스트

터미널에서 저장소 폴더로 이동한 뒤 실행합니다.

```bash
bash scripts/test-ios-mac.sh
```

스크립트는 설치된 iPhone 시뮬레이터를 자동 선택해 앱을 빌드하고 15개 XCTest를 실행합니다. iOS 시뮬레이터가 없으면 Xcode Settings → Components에서 설치하세요. 테스트 결과는 `build/ios/run.*/LumiTests.xcresult`에 저장됩니다. 시뮬레이터 검증에는 유료 Apple 개발자 계정이 필요 없습니다.

빌드만 하려면:

```bash
xcodebuild -project ios/Lumi.xcodeproj -scheme Lumi \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath build/ios/DerivedData CODE_SIGNING_ALLOWED=NO build
```

GitHub Actions의 **iOS build and tests → Run workflow**도 선택적으로 사용할 수 있도록 워크플로를 포함했습니다. 자동 실행은 켜지 않았으며, GitHub 러너 사용 정책·할당량을 따릅니다. 시뮬레이터 앱과 테스트 결과를 만들며, 아이폰 설치용으로 서명한 IPA를 만들지는 않습니다.

## 여기서 확인한 것과 남은 검증

- Swift 6.0.3 Linux 컴파일러: 픽셀 엔진 실제 빌드 및 XCTest **11개 통과**, 실패 0.
- 실제 Swift 컴파일러의 Swift 5 문법 검사: iOS 앱·테스트 소스 검사.
- Xcode 프로젝트의 대상·소스 참조·공유 Scheme 및 아이콘 자산 구조 검사.
- Xcode UIKit/SwiftUI 타입 검사, 시뮬레이터 실행, 사진/영상 권한 및 출력 파일 확인: **미실행**.
- Apple 서명, 본인 아이폰 설치, 주변 사람에게 배포: **미실행**.

실행 로그와 아이폰 확인 순서는 [검증 기록](VALIDATION.md)에 있습니다.

픽셀 엔진만 따로 실행하려면 `cd ios && swift test`를 사용할 수 있습니다. 이는 UIKit·Photos·AVFoundation 검증을 대신하지 않습니다.

## 플랫폼 차이와 제한

iOS 결과는 사진 앱의 최근 항목에 저장됩니다. Android의 `Pictures/LUMI` 폴더와 경로가 다릅니다. iOS 영상은 최고 품질 MP4로 내보내며 재인코딩될 수 있으므로 Android의 무손실 remux와 파일 단위로 동일하지 않습니다. 투명 사진의 JPEG 출력은 흰색 배경으로 합성합니다. 편집 세션의 앱 프로세스 종료 후 복구는 아직 지원하지 않습니다.

피부색 기반 스무딩의 조명·피부색 한계와 AI 메이크업·배경 제거 등 미구현 범위는 기존 [전체 기능 추적표](../FEATURES.md)를 따릅니다. 실제 사진 품질과 iPhone 성능은 Mac/실기기에서 추가로 확인해야 합니다.
