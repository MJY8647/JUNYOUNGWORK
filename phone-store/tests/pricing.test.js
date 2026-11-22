import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyInstallment, quote, retailPrice } from '../src/pricing.js';
import { PRODUCTS } from '../src/products.js';
import { PLANS } from '../src/config.js';

const p50 = PRODUCTS.find((p) => p.id === '50');
const basic = PLANS.find((p) => p.id === 'choice-basic');

test('할부금은 원본 사이트 예시(772,000원 24개월 → 34,180원)와 일치', () => {
  assert.equal(monthlyInstallment(772000, 24), 34180);
});

test('일시납은 월 할부금 0원, 선납금 = 할부원금', () => {
  const q = quote({ product: p50, plan: basic, months: 0 });
  assert.equal(q.deviceMonthly, 0);
  assert.equal(q.upfront, q.principal);
});

test('기기값 할인: 할부원금 = 출고가 - 표시 할인액, 요금 할인 없음', () => {
  const q = quote({ product: p50, plan: basic, supportType: 'device' });
  assert.equal(q.principal, 1991000 - (1991000 - 1391000));
  assert.equal(q.planDiscount, 0);
  assert.equal(q.totalMonthly, q.deviceMonthly + 90000);
});

test('요금할인 25%: 기기 할인 없음, 90,000원 → 67,500원(KT 공식 표기와 일치)', () => {
  const q = quote({ product: p50, plan: basic, supportType: 'plan' });
  assert.equal(q.deviceDiscount, 0);
  assert.equal(q.planMonthly, 67500);
});

test('용량 가격이 없는 상품은 기본 용량만 견적 가능', () => {
  const s26 = PRODUCTS.find((p) => p.id === '28');
  assert.equal(retailPrice(s26, 0), 1403600);
  assert.equal(retailPrice(s26, 1), null);
  assert.equal(quote({ product: s26, storageIdx: 1, plan: basic }), null);
});

test('512GB 선택 시 출고가 반영', () => {
  const q = quote({ product: p50, storageIdx: 1, plan: basic });
  assert.equal(q.retail, 2299000);
});
