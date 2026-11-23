import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyInstallment, quote, retailPrice } from '../src/pricing.js';
import { PRODUCTS } from '../src/products.js';
import { PLANS } from '../src/config.js';
import { SUBSIDIES } from '../src/subsidies.js';

const p50 = PRODUCTS.find((p) => p.id === '50');
const basic = PLANS.find((p) => p.id === 'choice-90'); // 월 90,000원

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

test('제휴카드 할인은 월 납부액에서 빼고, 납부액보다 커지지 않음', () => {
  const q = quote({ product: p50, plan: basic, card: { max: 15000 } });
  assert.equal(q.cardDiscount, 15000);
  assert.equal(q.totalMonthly, q.beforeCard - 15000);
  const cheap = PLANS.find((p) => p.id === 'basic-0.6');
  const free = quote({ product: PRODUCTS.find((p) => p.id === '33'), plan: cheap, card: { max: 45000 } });
  assert.equal(free.totalMonthly, 0);
});

test('공식 통합요금제: 초이스 3종 + 베이직 14종, 요금할인 25%는 공식 선택약정 금액과 일치', () => {
  assert.equal(PLANS.filter((p) => p.group === 'choice').length, 3);
  assert.equal(PLANS.filter((p) => p.id.startsWith('basic-')).length, 14);
  const q = quote({ product: p50, plan: PLANS.find((p) => p.id === 'basic-110'), supportType: 'plan' });
  assert.equal(q.planMonthly, 51750); // KT 공식: 베이직110GB 선택약정 시 51,750원
});

test('지원금표가 있으면 공통지원금 + 판매점 추가지원금, 선택약정은 추가지원금만', () => {
  SUBSIDIES['50'] = { updatedAt: '2026-11-23', common: { default: { change: 300000, port: 450000, new: 300000 } }, extra: { change: 0, port: 100000, new: 0 } };
  try {
    const dev = quote({ product: p50, plan: basic, joinType: 'port' });
    assert.equal(dev.commonSubsidy, 450000);
    assert.equal(dev.extraSubsidy, 100000);
    assert.equal(dev.principal, 1991000 - 550000);
    assert.equal(dev.subsidySource, 'table');
    const plan = quote({ product: p50, plan: basic, joinType: 'port', supportType: 'plan' });
    assert.equal(plan.commonSubsidy, 0);
    assert.equal(plan.extraSubsidy, 100000);
    assert.equal(plan.planMonthly, 67500);
  } finally { delete SUBSIDIES['50']; }
});

test('할부이자 총액 = 월 할부금 × 개월 - 할부원금, 일시납은 0', () => {
  const q = quote({ product: p50, plan: basic, months: 24 });
  assert.equal(q.totalInterest, q.deviceMonthly * 24 - q.principal);
  assert.equal(quote({ product: p50, plan: basic, months: 0 }).totalInterest, 0);
});
