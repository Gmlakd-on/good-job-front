import type { CoverStyleId } from "@/components/book-ui/bookTypes";

type SoundEvent = "stroke" | "stroke_end" | "erase" | "stamp" | "sticker_place" | "sticker_peel" | "type";

type SoundOptions = {
  pressure?: number;
  toolId?: string;
};

type SoundEntry = {
  url: string;
  volume?: number;
  playbackRate?: number;
  pitchVariance?: number;
  throttleMs?: number;
};

let audioCtx: AudioContext | null = null;
let muted = false;
let resumed = false;

const SOUND_BASE = "/sounds/editor";

/**
 * MP3-based sound map.
 *
 * Put replacement files under `public/sounds/editor/...`.
 * Example: `public/sounds/editor/stone/stroke.mp3` is served as `/sounds/editor/stone/stroke.mp3`.
 */
const SOUND_LIBRARY: Record<CoverStyleId, Partial<Record<SoundEvent, SoundEntry>>> = {
  stone: {
    stroke: { url: `${SOUND_BASE}/stone/stroke.mp3`, volume: 0.7, pitchVariance: 0.04, throttleMs: 35 },
    stroke_end: { url: `${SOUND_BASE}/stone/stroke-end.mp3`, volume: 0.55, pitchVariance: 0.03, throttleMs: 45 },
    erase: { url: `${SOUND_BASE}/stone/erase.mp3`, volume: 0.7, pitchVariance: 0.02, throttleMs: 60 },
  },
  archive: {
    stroke: { url: `${SOUND_BASE}/archive/stroke.mp3`, volume: 0.55, pitchVariance: 0.03, throttleMs: 35 },
    stroke_end: { url: `${SOUND_BASE}/archive/stroke-end.mp3`, volume: 0.42, pitchVariance: 0.02, throttleMs: 45 },
    erase: { url: `${SOUND_BASE}/archive/erase.mp3`, volume: 0.45, pitchVariance: 0.02, throttleMs: 60 },
    stamp: { url: `${SOUND_BASE}/archive/stamp.mp3`, volume: 0.75, pitchVariance: 0.02, throttleMs: 80 },
  },
  "1950": {
    stroke: { url: `${SOUND_BASE}/classic/stroke.mp3`, volume: 0.5, pitchVariance: 0.025, throttleMs: 35 },
    stroke_end: { url: `${SOUND_BASE}/classic/stroke-end.mp3`, volume: 0.4, pitchVariance: 0.02, throttleMs: 45 },
    erase: { url: `${SOUND_BASE}/classic/erase.mp3`, volume: 0.45, pitchVariance: 0.02, throttleMs: 60 },
    type: { url: `${SOUND_BASE}/classic/type.mp3`, volume: 0.38, pitchVariance: 0.05, throttleMs: 35 },
  },
  "1980": {
    stroke: { url: `${SOUND_BASE}/sketch/stroke.mp3`, volume: 0.65, pitchVariance: 0.06, throttleMs: 30 },
    stroke_end: { url: `${SOUND_BASE}/sketch/stroke-end.mp3`, volume: 0.45, pitchVariance: 0.04, throttleMs: 45 },
    erase: { url: `${SOUND_BASE}/sketch/erase.mp3`, volume: 0.7, pitchVariance: 0.03, throttleMs: 60 },
  },
  "1990": {
    stroke: { url: `${SOUND_BASE}/pop/stroke.mp3`, volume: 0.55, pitchVariance: 0.08, throttleMs: 35 },
    stroke_end: { url: `${SOUND_BASE}/pop/stroke-end.mp3`, volume: 0.5, pitchVariance: 0.07, throttleMs: 45 },
    erase: { url: `${SOUND_BASE}/pop/erase.mp3`, volume: 0.55, pitchVariance: 0.04, throttleMs: 60 },
    sticker_place: { url: `${SOUND_BASE}/pop/sticker-place.mp3`, volume: 0.7, pitchVariance: 0.06, throttleMs: 70 },
    sticker_peel: { url: `${SOUND_BASE}/pop/sticker-peel.mp3`, volume: 0.65, pitchVariance: 0.04, throttleMs: 90 },
  },
  "2000": {
    stroke: { url: `${SOUND_BASE}/kitsch/stroke.mp3`, volume: 0.6, pitchVariance: 0.08, throttleMs: 35 },
    stroke_end: { url: `${SOUND_BASE}/kitsch/stroke-end.mp3`, volume: 0.55, pitchVariance: 0.07, throttleMs: 45 },
    erase: { url: `${SOUND_BASE}/kitsch/erase.mp3`, volume: 0.55, pitchVariance: 0.04, throttleMs: 60 },
    sticker_place: { url: `${SOUND_BASE}/kitsch/sticker-place.mp3`, volume: 0.8, pitchVariance: 0.06, throttleMs: 70 },
    sticker_peel: { url: `${SOUND_BASE}/kitsch/sticker-peel.mp3`, volume: 0.65, pitchVariance: 0.04, throttleMs: 90 },
  },
  "2010": {
    stroke: { url: `${SOUND_BASE}/minimal/stroke.mp3`, volume: 0.35, pitchVariance: 0.025, throttleMs: 40 },
    stroke_end: { url: `${SOUND_BASE}/minimal/stroke-end.mp3`, volume: 0.28, pitchVariance: 0.02, throttleMs: 55 },
    erase: { url: `${SOUND_BASE}/minimal/erase.mp3`, volume: 0.35, pitchVariance: 0.02, throttleMs: 65 },
    type: { url: `${SOUND_BASE}/minimal/type.mp3`, volume: 0.28, pitchVariance: 0.04, throttleMs: 35 },
  },
};

const bufferCache = new Map<string, Promise<AudioBuffer | null>>();
const unavailableUrls = new Set<string>();

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/** Must be called from a user gesture to resume AudioContext */
export function resumeAudio() {
  if (resumed) return;
  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume();
  }
  resumed = true;
}

export function setMuted(m: boolean) {
  muted = m;
}

export function isMuted(): boolean {
  return muted;
}

async function loadBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer | null> {
  if (unavailableUrls.has(url)) return null;

  const cached = bufferCache.get(url);
  if (cached) return cached;

  const pending = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Sound file not found: ${url}`);
      return res.arrayBuffer();
    })
    .then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer))
    .catch(() => {
      unavailableUrls.add(url);
      return null;
    });

  bufferCache.set(url, pending);
  return pending;
}

function pressureToGain(pressure: number) {
  const normalized = Math.min(1, Math.max(0.05, pressure));
  return 0.75 + normalized * 0.5;
}

function playBufferedSound(ctx: AudioContext, sound: SoundEntry, pressure: number) {
  void loadBuffer(ctx, sound.url).then((buffer) => {
    if (!buffer || muted || ctx.state !== "running") return;

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const pitchVariance = sound.pitchVariance ?? 0;
    const randomPitch = pitchVariance ? 1 + (Math.random() * 2 - 1) * pitchVariance : 1;

    source.buffer = buffer;
    source.playbackRate.value = (sound.playbackRate ?? 1) * randomPitch;
    gain.gain.value = (sound.volume ?? 0.6) * pressureToGain(pressure);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  });
}

function pickSound(world: CoverStyleId, event: SoundEvent): SoundEntry | null {
  const library = SOUND_LIBRARY[world];
  const exact = library[event];
  if (exact) return exact;

  if (event === "stroke_end") return library.stroke ?? null;
  if (event === "stamp") return library.sticker_place ?? library.stroke_end ?? library.stroke ?? null;
  if (event === "sticker_place" || event === "sticker_peel") return library.stroke_end ?? library.stroke ?? null;
  if (event === "type") return library.stroke ?? null;

  return null;
}

// Throttle to avoid too-frequent sound per world/event.
const lastPlayTime: Record<string, number> = {};

export function playSound(world: CoverStyleId, event: SoundEvent, options: SoundOptions = {}) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx || ctx.state !== "running") return;

  const sound = pickSound(world, event);
  if (!sound) return;

  const now = Date.now();
  const key = `${world}_${event}`;
  const throttleMs = sound.throttleMs ?? 30;
  if (now - (lastPlayTime[key] || 0) < throttleMs) return;
  lastPlayTime[key] = now;

  try {
    playBufferedSound(ctx, sound, options.pressure ?? 0.5);
  } catch {
    // Silently fail — audio is non-critical.
  }
}

export function preloadWorldSounds(world: CoverStyleId) {
  const ctx = getCtx();
  if (!ctx) return;

  for (const sound of Object.values(SOUND_LIBRARY[world])) {
    if (sound) void loadBuffer(ctx, sound.url);
  }
}
