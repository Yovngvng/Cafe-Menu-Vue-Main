/** Kitchen chime. Queues until the first user gesture unlocks audio. */

let audioCtx = null;
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

function ping(ctx, frequency, start, duration, type = "sine", peak = 0.9) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playNow() {
  const ctx = context();
  if (!ctx || ctx.state !== "running") return false;
  const t = ctx.currentTime + 0.01;
  ping(ctx, 523.25, t, 0.18, "triangle", 0.85);
  ping(ctx, 659.25, t + 0.14, 0.2, "triangle", 0.9);
  ping(ctx, 783.99, t + 0.3, 0.28, "sine", 0.95);
  ping(ctx, 1046.5, t + 0.48, 0.55, "sine", 0.92);
  ping(ctx, 1318.5, t + 0.52, 0.22, "triangle", 0.55);
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
  if (ctx.state === "running") flushQueue();
  return ctx.state === "running";
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
  const onInteract = () => unlockAudio();
  window.addEventListener("pointerdown", onInteract, { capture: true });
  window.addEventListener("keydown", onInteract, { capture: true });
  window.addEventListener("touchstart", onInteract, { capture: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") unlockAudio();
  });
}

if (typeof window !== "undefined") {
  bindAudioUnlock();
}
