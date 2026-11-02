// 効果音は音声ファイルを使わず WebAudio で その場で作る（オフラインでも鳴り、ライセンスの心配もない）
let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freqs: number[], step = 0.08, type: OscillatorType = 'sine', vol = 0.12): void {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime;
  freqs.forEach((f, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = f;
    const t = t0 + i * step;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + step * 2.2);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + step * 2.4);
  });
}

export const sfx = {
  tap: () => tone([880], 0.05, 'sine', 0.06),
  ok: () => tone([660, 880], 0.07),
  no: () => tone([330, 262], 0.09, 'triangle', 0.08),
  pick: () => tone([988, 1319], 0.06, 'sine', 0.08),
  chest: () => tone([523, 659, 784, 1047], 0.09),
  fanfare: () => tone([523, 659, 784, 1047, 1319], 0.11, 'triangle', 0.1),
  sparkle: () => tone([1568, 1976, 2349], 0.05, 'sine', 0.05),
};
