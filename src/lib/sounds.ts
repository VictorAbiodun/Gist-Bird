/**
 * Synthesized, zero-asset bird & chat sound effects using the Web Audio API.
 */

const MUTE_KEY = 'gist_bird_sound_muted';

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (isSoundMuted()) return null;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!sharedCtx) {
      sharedCtx = new AudioCtx();
    }
    if (sharedCtx.state === 'suspended') {
      sharedCtx.resume().catch(() => {});
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // ignore
  }
}

function playTone(
  ctx: AudioContext,
  freqStart: number,
  freqEnd: number,
  startTime: number,
  duration: number,
  volume = 0.08,
  type: OscillatorType = 'sine'
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, startTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), startTime + duration);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

/** Soft warm pop when sending a message */
export function playSendSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 420, 680, now, 0.09, 0.07, 'sine');
}

/** Gentle two-note bird chirp when receiving a message */
export function playReceiveSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 740, 960, now, 0.08, 0.07, 'sine');
  playTone(ctx, 880, 1180, now + 0.09, 0.11, 0.06, 'sine');
}

/** Cheerful bird chirp when a new paper lands on the tree */
export function playBirdLandSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 660, 880, now, 0.07, 0.06, 'triangle');
  playTone(ctx, 880, 1175, now + 0.08, 0.08, 0.06, 'triangle');
  playTone(ctx, 1046, 1396, now + 0.17, 0.12, 0.05, 'sine');
}
