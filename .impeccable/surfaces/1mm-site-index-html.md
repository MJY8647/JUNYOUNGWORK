---
version: 1
slug: "1mm-site-index-html"
primary_target: "1mm-site/index.html"
related_targets: []
---

# 1mm intro site (1mm-site/index.html)

Mode: Persuade. Audience: people about to change phones (mostly on phones) + investors/reviewers. Action: open the quote prototype (https://claude.ai/artifact/5o5qAhFwsVt9oBGCCPRGjy). Proof: only facts from the prototype; every amount labeled 예시. Constraints: name "1mm" only; navy #1E2A5A + yellow #FFD23F; Noto Sans KR + Nunito 900 wordmark; no carrier/Apple/Samsung logos; no invented reviews or stats. Build path: code-first (no image generation).

## Direction contract

THESIS: The page is the 1mm quick parcel itself. It refuses the telecom-shop default (banner of subsidy numbers over a grid of phone cards); you receive a box and open it.

OWN-WORLD: Kraft-free: the box is navy board (#1E2A5A) with a yellow (#FFD23F) waybill label, Korean waybill type in navy ink on the label, perforation rules, barcode strip drawn from type, tape bands in yellow. Inside: pale #f3f5f9 tray, white insert cards with die-cut corners, numbered contents list.

STORY: Visitor learns 1mm delivers a phone today by quick, sees what is inside (phone via 3 routes, USIM = activate after receiving, inspection sheet, 7-day card, limits), believes it is honest because limits and 예시 are printed, and taps 내 견적 보기.

FIRST VIEWPORT: Full-bleed navy box face; a large yellow waybill occupies the center (보내는 곳 1mm / 받는 곳 고객님 문 앞 / 내용물 미개통 폰 + 새 유심 / 배송 퀵 · 오늘), headline "퀵으로 오늘 받는 휴대폰" set on the waybill; primary CTA 내 견적 보기 as the waybill's tear-off stub; a tape band reading 열기 ↓ cues scroll.

FORM: Parcel unboxing, position 5 on my ordered list; signature interaction: scrolling slits the tape and the lid flaps open (CSS scroll-driven / IntersectionObserver), revealing the contents list ①–④ which each become a section. seed: seed:a7e64944df401c97

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
