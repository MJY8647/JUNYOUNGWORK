import { INSTALLMENT_RATE, PLAN_DISCOUNT_RATE } from './config.js';

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

export function quote({ product, storageIdx = 0, supportType = 'device', plan, months = 24 }) {
  const retail = retailPrice(product, storageIdx);
  if (retail == null || !plan) return null;
  // 기기값 할인 = 수집 당시 표시된 최대 할인액(출고가 - 할인가). 실제 지원금은 조건에 따라 다름.
  const maxDiscount = Math.max(0, product.listPrice - product.dealPrice);
  const deviceDiscount = supportType === 'device' ? Math.min(maxDiscount, retail) : 0;
  const principal = retail - deviceDiscount;
  const deviceMonthly = monthlyInstallment(principal, months);
  const planDiscount = supportType === 'plan' ? Math.round(plan.fee * PLAN_DISCOUNT_RATE) : 0;
  const planMonthly = plan.fee - planDiscount;
  return {
    retail, deviceDiscount, principal, months, deviceMonthly,
    upfront: months === 0 ? principal : 0,
    planFee: plan.fee, planDiscount, planMonthly,
    totalMonthly: deviceMonthly + planMonthly,
  };
}

export const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;
