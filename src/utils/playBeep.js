/** Loud two-tone kitchen alert. Queues until the first user gesture unlocks audio. */

let audioCtx = null;
let unlocked = false;
let queued = 0;
let listenersBound = false;

function AudioCtx() {
  return window.AudioContext || window.webkitAudioContext;
}

function context() {
  const Ctx = AudioCtx();
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

function tone(ctx, frequency, start, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = "square";
  osc.frequency.setValueAtTime(frequency, start);
  filter.type = "highpass";
  filter.frequency.setValueAtTime(400, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.95, start + 0.018);
  gain.gain.setValueAtTime(0.95, start + duration * 0.55);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function playNow() {
  const ctx = context();
  if (!ctx || ctx.state !== "running") return false;
  const t = ctx.currentTime + 0.01;
  tone(ctx, 880, t, 0.28);
  tone(ctx, 1397, t + 0.32, 0.38);
  tone(ctx, 880, t + 0.78, 0.22);
  return true;
}

function flushQueue() {
  const count = queued;
  queued = 0;
  for (let i = 0; i < count; i += 1) playNow();
}

export async function unlockAudio() {
  const ctx = context();
  if (!ctx) return false;
  try {
    if (ctx.state === "suspended") await ctx.resume();
  } catch (e) {
    console.warn("audio unlock failed", e);
  }
  unlocked = ctx.state === "running";
  if (unlocked) flushQueue();
  return unlocked;
}

export function playBeep() {
  const ctx = context();
  if (!ctx) return;
  if (ctx.state === "running") {
    playNow();
    return;
  }
  queued += 1;
  unlockAudio();
}

export function bindAudioUnlock() {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;
  const onInteract = () => {
    unlockAudio();
  };
  window.addEventListener("pointerdown", onInteract, { capture: true });
  window.addEventListener("keydown", onInteract, { capture: true });
  window.addEventListener("touchstart", onInteract, { capture: true });
}

if (typeof window !== "undefined") {
  bindAudioUnlock();
}
