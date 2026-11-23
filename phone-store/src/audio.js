// 효과음과 배경음악. 외부 음원 없이 Web Audio로 직접 합성한다(저작권 걱정 없음, 다운로드 0).
// 브라우저 정책상 첫 클릭·터치·키 입력 전에는 소리를 낼 수 없어 unlock() 이후부터 재생된다.

const PREF_KEY = 'tps-audio-v1';
const prefs = (() => { try { return { music: true, sfx: true, ...JSON.parse(localStorage.getItem(PREF_KEY)) }; } catch { return { music: true, sfx: true }; } })();
const savePrefs = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* 무시 */ } };

let ctx = null, master, musicBus, sfxBus, noiseBuf, delay;
let wantMusic = false, musicTimer = 0, nextNoteTime = 0, step = 0;
const listeners = new Set();

function init() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = prefs.music ? 0.32 : 0; musicBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = prefs.sfx ? 0.6 : 0; sfxBus.connect(master);
  // 멜로디용 잔향(딜레이)
  delay = ctx.createDelay(1); delay.delayTime.value = 0.33;
  const fb = ctx.createGain(); fb.gain.value = 0.28;
  const wet = ctx.createGain(); wet.gain.value = 0.35;
  delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(musicBus);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  document.addEventListener('visibilitychange', () => { if (document.hidden) ctx.suspend(); else ctx.resume(); });
}

// ---------- 합성 도우미 ----------
function tone(freq, { at = 0, dur = 0.15, type = 'sine', gain = 0.2, attack = 0.005, slideTo = null, bus = sfxBus, send = false } = {}) {
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus);
  if (send) g.connect(delay);
  o.start(t); o.stop(t + dur + 0.02);
}
function noise({ at = 0, dur = 0.05, gain = 0.2, type = 'bandpass', freq = 1000, q = 1, bus = sfxBus } = {}) {
  const t = ctx.currentTime + at;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  s.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(bus);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const rnd = (a, b) => a + Math.random() * (b - a);

// ---------- 효과음 ----------
const SFX = {
  step: () => noise({ dur: 0.05, gain: 0.12, freq: rnd(900, 1500), q: 1.2 }),
  stepWood: () => { noise({ dur: 0.06, gain: 0.14, freq: rnd(450, 650), q: 2 }); tone(rnd(160, 190), { dur: 0.06, gain: 0.05, type: 'triangle' }); },
  jump: () => tone(320, { dur: 0.18, slideTo: 760, type: 'triangle', gain: 0.16 }),
  land: () => { noise({ dur: 0.09, gain: 0.18, type: 'lowpass', freq: 380 }); tone(95, { dur: 0.1, gain: 0.12 }); },
  tick: () => tone(1320, { dur: 0.05, type: 'triangle', gain: 0.07 }),
  click: () => tone(880, { dur: 0.05, type: 'triangle', gain: 0.08 }),
  enter: () => { tone(midi(76), { dur: 0.35, gain: 0.14 }); tone(midi(83), { at: 0.09, dur: 0.5, gain: 0.12 }); tone(midi(88), { at: 0.18, dur: 0.6, gain: 0.08, type: 'triangle' }); },
  close: () => { tone(midi(83), { dur: 0.2, gain: 0.1 }); tone(midi(76), { at: 0.08, dur: 0.3, gain: 0.1 }); },
  zone: () => [72, 76, 79, 84].forEach((n, i) => tone(midi(n), { at: i * 0.07, dur: 0.5, gain: 0.07, type: 'triangle' })),
  talk: (pitch = 1) => tone(rnd(330, 470) * pitch, { dur: 0.045, type: 'square', gain: 0.035, attack: 0.002 }),
  honk: () => { tone(415, { dur: 0.12, type: 'square', gain: 0.06 }); tone(415, { at: 0.17, dur: 0.14, type: 'square', gain: 0.06 }); },
  pop: () => { tone(600, { dur: 0.12, slideTo: 1100, gain: 0.14 }); tone(midi(91), { at: 0.08, dur: 0.25, gain: 0.05, type: 'triangle' }); },
  success: () => [72, 76, 79, 84, 88].forEach((n, i) => tone(midi(n), { at: i * 0.09, dur: i === 4 ? 0.8 : 0.3, gain: 0.11, type: i % 2 ? 'triangle' : 'sine' })),
  error: () => { tone(247, { dur: 0.12, type: 'triangle', gain: 0.1 }); tone(196, { at: 0.11, dur: 0.2, type: 'triangle', gain: 0.1 }); },
};

// ---------- 배경음악: 92BPM, 4마디 코드 진행 위에 펜타토닉 멜로디가 매번 조금씩 다르게 ----------
const BPM = 92, EIGHTH = 60 / BPM / 2;
const CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]; // Fmaj7 Em7 Dm7 Cmaj7
const PENTA = [72, 74, 76, 79, 81, 84, 86];
let melodyIdx = 2;

function scheduleStep(t) {
  const bar = Math.floor(step / 8) % CHORDS.length, beat = step % 8;
  const chord = CHORDS[bar];
  const at = t - ctx.currentTime;
  if (beat === 0) {
    // 패드: 부드럽게 깔리는 화음
    chord.forEach((n) => tone(midi(n), { at, dur: EIGHTH * 8, type: 'triangle', gain: 0.035, attack: 0.4, bus: musicBus }));
  }
  if (beat === 0 || beat === 4) tone(midi(chord[0] - 12), { at, dur: EIGHTH * 3.5, gain: 0.12, attack: 0.02, bus: musicBus });
  if (beat % 2 === 1) noise({ at, dur: 0.04, gain: 0.025, type: 'highpass', freq: 6000, bus: musicBus });
  // 멜로디: 다음 음으로 한두 칸씩 움직이는 랜덤 워크, 가끔 쉰다
  const play = beat === 0 ? 0.9 : beat % 2 === 0 ? 0.55 : 0.25;
  if (Math.random() < play) {
    melodyIdx = Math.max(0, Math.min(PENTA.length - 1, melodyIdx + Math.round(rnd(-2, 2))));
    tone(midi(PENTA[melodyIdx]), { at, dur: EIGHTH * 1.8, type: 'triangle', gain: 0.07, attack: 0.008, bus: musicBus, send: true });
  }
  step++;
}
function scheduler() {
  while (nextNoteTime < ctx.currentTime + 0.12) { scheduleStep(nextNoteTime); nextNoteTime += EIGHTH; }
  musicTimer = setTimeout(scheduler, 40);
}
function startScheduler() {
  if (!ctx || musicTimer || !prefs.music || !wantMusic) return;
  nextNoteTime = ctx.currentTime + 0.1; step = 0;
  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
  musicBus.gain.exponentialRampToValueAtTime(0.32, ctx.currentTime + 2.5);
  scheduler();
}
function stopScheduler() {
  clearTimeout(musicTimer); musicTimer = 0;
  if (ctx) { musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3); }
}

export const audio = {
  prefs,
  // 첫 사용자 입력 때 호출
  unlock() { init(); if (ctx?.state === 'suspended') ctx.resume(); startScheduler(); },
  sfx(name, ...args) { if (ctx && prefs.sfx && ctx.state === 'running') SFX[name]?.(...args); },
  playMusic() { wantMusic = true; startScheduler(); },
  stopMusic() { wantMusic = false; stopScheduler(); },
  setMusic(on) { prefs.music = on; savePrefs(); if (on) startScheduler(); else stopScheduler(); listeners.forEach((f) => f()); },
  setSfx(on) { prefs.sfx = on; savePrefs(); if (sfxBus) sfxBus.gain.value = on ? 0.6 : 0; listeners.forEach((f) => f()); },
  subscribe(f) { listeners.add(f); return () => listeners.delete(f); },
};

// 첫 입력에서 오디오 잠금 해제
const unlockOnce = () => { audio.unlock(); ['pointerdown', 'keydown'].forEach((e) => removeEventListener(e, unlockOnce, true)); };
['pointerdown', 'keydown'].forEach((e) => addEventListener(e, unlockOnce, true));
