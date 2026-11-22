import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidPhone, isValidBirth, ageOn, needsStrongId, carrierError, makeOrderNo, matchGuestOrder } from '../src/orders.js';

test('휴대폰 번호 검증 (하이픈 허용)', () => {
  assert.equal(isValidPhone('010-1234-5678'), true);
  assert.equal(isValidPhone('01112345678'), true);
  assert.equal(isValidPhone('02-123-4567'), false);
  assert.equal(isValidPhone('010-123'), false);
});

test('생년월일 6자리: 없는 날짜는 거부', () => {
  assert.equal(isValidBirth('950101'), true);
  assert.equal(isValidBirth('000229'), true);  // 2000년 윤년
  assert.equal(isValidBirth('010229'), false); // 2001년은 윤년 아님
  assert.equal(isValidBirth('951301'), false);
  assert.equal(isValidBirth('9501'), false);
});

test('만 나이 계산 (생일 전후)', () => {
  const now = new Date(2026, 10, 22);
  assert.equal(ageOn('081122', now), 18);
  assert.equal(ageOn('081123', now), 17);
  assert.equal(ageOn('951231', now), 30);
});

test('강화 본인확인은 신규가입·번호이동만', () => {
  assert.equal(needsStrongId('new'), true);
  assert.equal(needsStrongId('port'), true);
  assert.equal(needsStrongId('change'), false);
});

test('가입유형과 현재 통신사 일치 검사', () => {
  assert.equal(carrierError('change', 'KT'), null);
  assert.ok(carrierError('change', 'SKT'));
  assert.ok(carrierError('port', 'KT'));
  assert.equal(carrierError('port', 'LG U+'), null);
  assert.equal(carrierError('new', 'KT'), null);
});

test('주문번호 형식', () => {
  assert.equal(makeOrderNo(new Date(2026, 10, 22), () => 0.0421), 'PS261122042100');
});

test('비회원 주문조회는 이름·휴대폰·주문번호가 모두 맞아야 함', () => {
  const o = { guest: true, no: 'PS261122000001', subscriber: { name: '홍길동', phone: '01012345678' } };
  assert.equal(matchGuestOrder(o, { name: '홍길동', phone: '010-1234-5678', orderNo: 'ps261122000001' }), true);
  assert.equal(matchGuestOrder(o, { name: '홍길순', phone: '010-1234-5678', orderNo: 'PS261122000001' }), false);
  assert.equal(matchGuestOrder({ ...o, guest: false }, { name: '홍길동', phone: '01012345678', orderNo: 'PS261122000001' }), false);
});
