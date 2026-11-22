// 회원 계정과 소셜 로그인.
// 소셜 로그인은 config.js SOCIAL에 앱 키(clientId)와 redirectUri를 넣으면 각 서비스의 실제 로그인 창으로 보낸다.
// 키가 없으면 데모 모드: 이 브라우저에만 데모 계정을 만든다.
// 실제 서비스는 로그인 창에서 돌아온 인가 코드를 서버가 토큰으로 바꾸고 회원 정보를 확인해야 한다(앱 키 비밀값은 서버에만).
import { SOCIAL } from './config.js';

const USERS = 'tps-users-v1', SESSION = 'tps-session-v1', STATE = 'tps-oauth-state';
const listeners = new Set();

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장소 사용 불가 */ } };
const users = () => load(USERS, []);

export const PROVIDERS = {
  kakao: { label: '카카오', authorize: 'https://kauth.kakao.com/oauth/authorize', scope: '' },
  naver: { label: '네이버', authorize: 'https://nid.naver.com/oauth2.0/authorize', scope: '' },
  google: { label: 'Google', authorize: 'https://accounts.google.com/o/oauth2/v2/auth', scope: 'openid email profile' },
};

export const isRealLogin = (provider) => Boolean(SOCIAL[provider]?.clientId && SOCIAL[provider]?.redirectUri);

// 실제 로그인 창 주소 (CSRF 방지용 state 포함)
export function authorizeUrl(provider, state) {
  const p = PROVIDERS[provider], c = SOCIAL[provider];
  const q = new URLSearchParams({ response_type: 'code', client_id: c.clientId, redirect_uri: c.redirectUri, state });
  if (p.scope) q.set('scope', p.scope);
  return `${p.authorize}?${q}`;
}

export function startRealLogin(provider, next) {
  const state = crypto.getRandomValues(new Uint32Array(4)).join('-');
  try { sessionStorage.setItem(STATE, JSON.stringify({ state, provider, next })); } catch { /* 무시 */ }
  location.href = authorizeUrl(provider, state);
}

export const account = {
  current() {
    const id = load(SESSION, null);
    return id ? users().find((u) => u.id === id) ?? null : null;
  },
  // 소셜 계정으로 로그인. 처음이면 가입 대기 상태(약관 동의 전)로 만든다.
  socialSignIn(provider, profile) {
    const list = users();
    let u = list.find((x) => x.provider === provider && x.email === profile.email);
    const isNew = !u;
    if (!u) {
      u = { id: `${provider}-${Date.now().toString(36)}`, provider, name: profile.name, email: profile.email, demo: profile.demo, createdAt: new Date().toISOString(), signupDone: false };
      list.push(u);
      save(USERS, list);
    }
    save(SESSION, u.id);
    listeners.forEach((fn) => fn());
    return { user: u, isNew: isNew || !u.signupDone };
  },
  update(patch) {
    const cur = this.current();
    if (!cur) return null;
    const list = users().map((u) => (u.id === cur.id ? { ...u, ...patch } : u));
    save(USERS, list);
    listeners.forEach((fn) => fn());
    return list.find((u) => u.id === cur.id);
  },
  logout() { save(SESSION, null); listeners.forEach((fn) => fn()); },
  withdraw() {
    const cur = this.current();
    if (!cur) return;
    save(USERS, users().filter((u) => u.id !== cur.id));
    this.logout();
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};
