# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: static HTML/CSS/JS, one self-contained folder (`1mm-site/`), so it can be opened directly or published as a claude.ai Artifact without a build step. Chosen because the owner is a beginner and the existing prototype is also a single HTML page.

## Users

- Primary: ordinary people in Korea about to change phones who find carrier subsidies, plans and contracts confusing and want the cheapest option, delivered fast. They mostly browse on a phone.
- Secondary: investors / reviewers evaluating 1mm as a business idea, who need to see the problem and the service structure.

## Product Purpose

1mm (tagline: "퀵으로 받는 휴대폰") quotes and sells phones three ways — carrier activation (SKT · KT · LG U+ 번호이동·기기변경), unlocked 자급제, and inspected used phones — shows the cheapest condition first, and delivers by motorcycle quick the same day. Success for the intro site: the visitor understands the service and opens the quote prototype.

## Positioning

- Core premise (owner): customers arrive having **already decided which phone to buy**. The whole service starts from that model (model → color/storage → cheapest route/plan → quick delivery); the budget-based recommender is only a fallback for the undecided.
- Core promise (owner, latest): **원하는 폰을, 원하는 조건으로, 최저가로, 가장 빠르게 받는다.** Quick delivery is the speed half of that promise, not the whole story.

- Compares all three buying routes (통신사 개통 / 자급제 / 중고폰) in one flow, cheapest condition first.
- "1mm가 골라드려요": a few questions (current carrier, family/internet bundle, monthly budget, data use, brand) → phones that fit a monthly budget (phone + plan combined).
- Same-day quick delivery; carrier activation happens only after the customer receives the phone (unactivated phone + new USIM), so the current phone never goes dead in transit.

## Operating Context

- Flow in the prototype: 개통 방법 → 브랜드/제품 → 조건 비교 → 주문서 → 실시간 배송 현황 → 완료.
- Activation runs only in carrier activation hours (Mon–Sat; not on Sundays or holidays); requests outside hours are processed at the next activation window.
- After purchase: data transfer guidance (빠른 시작 / Smart Switch), 쓰던 폰 1mm 모바일 매입 (customer sends the phone — delivery method TBD, likely parcel, quick pickup on hold; price is confirmed after 1mm inspects it on arrival), 7-day exchange/refund.

## Capabilities and Constraints

- Quick fee covered up to 50,000원; farther distances may cost extra (told before departure, or switch to free parcel). Remote/island areas: parcel only. Jeju: no delivery.
- Used phones: 1mm 검수 5 checks — IMEI 분실·도난 조회, 통화·카메라·Wi-Fi·충전 정상, 배터리 성능 표시, 초기화·계정 잠금 해제, 7일 안 결함 시 교환·환불. Grades S (거의 사용감 없음) / A (미세 기스) / B (눈에 띄는 기스).
- 알림표 (owner-requested feature): from the 개통일, 1mm tells when the high-tier plan condition (typically 6개월, often counted as 183 days) is met — it shows the later of the calendar-month date and the 183-day date (e.g. 2026-01-01 개통 → 6/1 too early, 7/1 is 181 days, 7/3 safe) — and sends alerts 3 days before / on that day, and 1 month, 2 weeks, 1 week before 약정 ends, for people who switch every cycle. Store contracts override the calculation; lowering below the carrier floor after 6 months can still trigger 반환금 (e.g. LG U+ 5G under 45,000원). Alerts are not actually sent in the prototype.
- Membership: no fee, extra discount (prototype example 30,000원), contract-end reminder.
- Status: **prototype**. Subsidies, plans, stock, quick fees and the membership amount are examples. No real customers, reviews, or operating stats exist.
- Prototype URL (primary CTA target): https://claude.ai/artifact/5o5qAhFwsVt9oBGCCPRGjy

## Brand Commitments

- Name: "1mm 모바일" in copy (owner, later request; earlier "1mm"; do not use "케통령"). Logo stays the wordmark "1mm" with "mm" in the accent color.
- Brand D안: navy #1E2A5A + yellow #FFD23F point; Noto Sans KR text, Nunito 900 logo (from the prototype).
- Carrier names appear as plain text; official carrier/Apple/Samsung logos are not used.
- Voice: friendly 해요체, short, concrete ("질문 몇 개면 끝", "가장 싼 조건부터 보여드려요").

## Evidence on Hand

- The prototype itself (artifact above). No testimonials, partner names, press, sales numbers, or photos. Never fabricate these; label example amounts as 예시.

## Product Principles

1. Cheapest honest condition first; every amount that is an example says so.
2. Never leave the customer without a working phone.
3. Few questions, plain words — the customer should not need to know telecom jargon.
4. Be explicit about limits (activation hours, extra quick fee, Jeju).
