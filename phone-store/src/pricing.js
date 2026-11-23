import { INSTALLMENT_RATE, PLAN_DISCOUNT_RATE } from './config.js';
import { subsidyFor } from './subsidies.js';

const round10 = (n) => Math.round(n / 10) * 10;

// 원리금균등 상환. 0개월은 일시납.
export function monthlyInstallment(principal, months, rate = INSTALLMENT_RATE) {
  if (months === 0 || principal <= 0) return 0;
  const r = rate / 12;
  return round10((principal * r) / (1 - Math.pow(1 + r, -months)));
}

// 용량별 출고가. 기본 용량은 목록 출고가, 나머지는 데이터가 있을 때만.
export function retailPrice(product, storageIdx) {
  if (product.storagePrices) return product.storagePrices[storageIdx] ?? null;
  return storageIdx === 0 ? product.listPrice : null;
}

// card: 선택한 제휴카드({ max }). 전월 실적 충족 시 받는 월 최대 청구할인으로, 월 납부액보다 커질 수 없다.
// 지원금: 지원금표가 있으면 공통지원금(기기값 할인 선택 시만) + 판매점 추가지원금(할인방법과 무관, 단통법 폐지 후 선택약정도 가능).
// 표가 없으면 수집 당시 표시된 최대 할인액(출고가 - 할인가)을 예상 지원금으로 쓴다.
export function quote({ product, storageIdx = 0, supportType = 'device', plan, months = 24, card = null, joinType = 'change' }) {
  const retail = retailPrice(product, storageIdx);
  if (retail == null || !plan) return null;
  const table = subsidyFor(product.id, plan.id, joinType);
  let commonSubsidy, extraSubsidy;
  if (table) {
    commonSubsidy = supportType === 'device' ? table.common : 0;
    extraSubsidy = table.extra;
  } else {
    commonSubsidy = supportType === 'device' ? Math.max(0, product.listPrice - product.dealPrice) : 0;
    extraSubsidy = 0;
  }
  const deviceDiscount = Math.min(commonSubsidy + extraSubsidy, retail);
  const principal = retail - deviceDiscount;
  const totalInterest = months ? monthlyInstallment(principal, months) * months - principal : 0;
  const deviceMonthly = monthlyInstallment(principal, months);
  const planDiscount = supportType === 'plan' ? Math.round(plan.fee * PLAN_DISCOUNT_RATE) : 0;
  const planMonthly = plan.fee - planDiscount;
  const beforeCard = deviceMonthly + planMonthly;
  const cardDiscount = card ? Math.min(card.max, beforeCard) : 0;
  return {
    retail, deviceDiscount, commonSubsidy, extraSubsidy, subsidySource: table ? 'table' : 'estimate', subsidyDate: table?.updatedAt ?? null,
    principal, months, deviceMonthly, totalInterest: Math.max(0, totalInterest),
    upfront: months === 0 ? principal : 0,
    planFee: plan.fee, planDiscount, planMonthly,
    beforeCard, cardDiscount, totalMonthly: beforeCard - cardDiscount,
    // 할인방법 비교용: 24개월 동안 받는 할인 총액
    deviceDiscountTotal: table ? table.common + table.extra : Math.max(0, product.listPrice - product.dealPrice),
    planDiscountTotal24: Math.round(plan.fee * PLAN_DISCOUNT_RATE) * 24,
  };
}

export const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;
