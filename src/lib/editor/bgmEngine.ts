export type BgmTrack = {
  id: string;
  title: string;
  url: string;
};

export type BgmSnapshot = {
  currentTrack: BgmTrack;
  currentIndex: number;
  isPlaying: boolean;
};

const BGM_BASE = "/sounds/editor";
const STORAGE_KEY = "good-job-editor-bgm-track";
const DEFAULT_VOLUME = 0.24;

const soundUrl = (...segments: string[]) =>
  `${BGM_BASE}/${segments.map(encodeURIComponent).join("/")}`;

export const BGM_TRACKS: BgmTrack[] = [
  {
    id: "archive-tea",
    title: "A Cup of Tea",
    url: soundUrl("archive", "A cup of tea.mp3"),
  },
  {
    id: "classic-josephine",
    title: "Come On Josephine",
    url: soundUrl("classic", "Come On Josephine In My Flying Machine_[cut_188sec].mp3"),
  },
  {
    id: "classic-mother",
    title: "O matko moja",
    url: soundUrl(
      "classic",
      "Adamo DIDUR-O matko moja, Oh mother - G&T 22717 Mx. 1809 B Warsaw XI. 1901-13.mp3",
    ),
  },
  {
    id: "classic-life",
    title: "What Is Our Life",
    url: soundUrl(
      "classic",
      "Alexander DAVYDOV - 22515, Mx. 256 G (June 1901) - What is our life (Tchaikovsky, Queen of Spades)-01.mp3",
    ),
  },
  {
    id: "classic-marietta",
    title: "Marietta",
    url: soundUrl("classic", "Marietta (Romilli) - Giuseppe DE LUCA.mp3"),
  },
  {
    id: "kitsch-bartender",
    title: "Bartender",
    url: soundUrl("kitsch", "Bartender.mp3"),
  },
  {
    id: "kitsch-oceanside",
    title: "Oceanside",
    url: soundUrl("kitsch", "Oceanside.mp3"),
  },
  {
    id: "pop-countryside",
    title: "Countryside",
    url: soundUrl("pop", "Countryside.mp3"),
  },
  {
    id: "pop-morning-rain",
    title: "Morning Rain",
    url: soundUrl("pop", "Morning rain.mp3"),
  },
  {
    id: "sketch-lofi",
    title: "Lofi Hiphop",
    url: soundUrl("sketch", "lofihiphop.ogg"),
  },
  {
    id: "stone-chill-lofi",
    title: "Chill Lofi",
    url: soundUrl("stone", "ChillLofiR.mp3"),
  },
];

type Listener = () => void;

let audio: HTMLAudioElement | null = null;
let currentIndex = 0;
let isPlaying = false;
let hasLoadedPreference = false;
const listeners = new Set<Listener>();

function normalizeIndex(index: number) {
  const length = BGM_TRACKS.length;
  return ((index % length) + length) % length;
}

function getStoredTrackId() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeTrackId(trackId: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, trackId);
  } catch {
    // BGM preference persistence is optional.
  }
}

function ensurePreferenceLoaded() {
  if (hasLoadedPreference) return;
  hasLoadedPreference = true;

  const storedTrackId = getStoredTrackId();
  const storedIndex = BGM_TRACKS.findIndex((track) => track.id === storedTrackId);
  if (storedIndex >= 0) currentIndex = storedIndex;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function syncAudioSource() {
  if (!audio) return;

  const track = BGM_TRACKS[currentIndex];
  if (audio.src.endsWith(track.url)) return;

  audio.src = track.url;
  audio.load();
}

function getAudio() {
  if (typeof window === "undefined") return null;
  if (audio) return audio;

  audio = new Audio();
  audio.loop = true;
  audio.preload = "metadata";
  audio.volume = DEFAULT_VOLUME;
  audio.addEventListener("pause", () => {
    if (!audio || audio.ended) return;
    isPlaying = false;
    emit();
  });
  audio.addEventListener("play", () => {
    isPlaying = true;
    emit();
  });
  audio.addEventListener("error", () => {
    isPlaying = false;
    emit();
  });

  syncAudioSource();
  return audio;
}

function selectTrack(index: number) {
  ensurePreferenceLoaded();
  currentIndex = normalizeIndex(index);
  storeTrackId(BGM_TRACKS[currentIndex].id);
  syncAudioSource();
  emit();
}

export function getBgmSnapshot(): BgmSnapshot {
  ensurePreferenceLoaded();

  return {
    currentTrack: BGM_TRACKS[currentIndex],
    currentIndex,
    isPlaying,
  };
}

export function subscribeBgm(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function playBgm() {
  ensurePreferenceLoaded();

  const player = getAudio();
  if (!player) return;

  syncAudioSource();

  try {
    await player.play();
    isPlaying = true;
  } catch {
    isPlaying = false;
  } finally {
    emit();
  }
}

export function pauseBgm() {
  if (!audio) {
    isPlaying = false;
    emit();
    return;
  }

  audio.pause();
  isPlaying = false;
  emit();
}

export function stopBgm() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  isPlaying = false;
  emit();
}

export function toggleBgm() {
  if (isPlaying) {
    pauseBgm();
    return;
  }

  void playBgm();
}

export function playPreviousBgm() {
  const shouldResume = isPlaying;
  selectTrack(currentIndex - 1);

  if (shouldResume) void playBgm();
}

export function playNextBgm() {
  const shouldResume = isPlaying;
  selectTrack(currentIndex + 1);

  if (shouldResume) void playBgm();
}