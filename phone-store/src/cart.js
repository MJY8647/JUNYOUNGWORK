// 장바구니는 이 브라우저에만 저장되는 편의 기능. 저장소를 못 쓰면 메모리로 동작.
const KEY = 'tps-cart-v1';
let memory = [];
const listeners = new Set();

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? memory; } catch { return memory; }
}
function write(items) {
  memory = items;
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* 사파리 사생활 보호 모드 등 */ }
  listeners.forEach((fn) => fn(items));
}

export const cart = {
  items: read,
  add(item) { write([...read(), { ...item, key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }]); },
  remove(key) { write(read().filter((i) => i.key !== key)); },
  update(key, patch) { write(read().map((i) => (i.key === key ? { ...i, ...patch } : i))); },
  clear() { write([]); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};
