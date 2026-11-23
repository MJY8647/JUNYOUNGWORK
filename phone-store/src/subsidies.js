// 지원금표: KT초이스가 받는 최신 KT 공시(공통)지원금과 판매점 추가지원금을 여기에 넣는다.
// KT 다이렉트샵 공시지원금 페이지는 자동 수집이 막혀 있어(reCAPTCHA) 판매점이 받은 표를 직접 입력해야 한다.
//
// 형식
//   SUBSIDIES[상품 id] = {
//     updatedAt: '2026-11-23',                       // 공시 기준일
//     common: { 'choice-90': { change: 500000, port: 500000, new: 500000 }, default: {...} },  // 요금제별 공통지원금 (없으면 default)
//     extra: { change: 0, port: 100000, new: 50000 },  // 판매점 추가지원금 (2025-07-22 단통법 폐지로 상한 없음)
//   }
// 표가 없는 상품은 수집 당시 표시 할인액을 '예상 지원금'으로 쓴다.
export const SUBSIDIES = {};

export function subsidyFor(productId, planId, joinType) {
  const t = SUBSIDIES[productId];
  if (!t) return null;
  const c = t.common?.[planId] ?? t.common?.default ?? {};
  return { common: c[joinType] ?? 0, extra: t.extra?.[joinType] ?? 0, updatedAt: t.updatedAt };
}
