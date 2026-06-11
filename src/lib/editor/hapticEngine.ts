import type { CoverStyleId } from "@/components/book-ui/bookTypes";

type HapticEvent = "stroke" | "stroke_end" | "erase" | "stamp" | "sticker_place" | "sticker_peel" | "type";

const hasVibration = typeof navigator !== "undefined" && "vibrate" in navigator;

// Throttle haptics to max once per 50ms
let lastHapticTime = 0;

function vibrate(pattern: number | number[]) {
  if (!hasVibration) return;
  const now = Date.now();
  if (now - lastHapticTime < 50) return;
  lastHapticTime = now;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Silently fail
  }
}

// ─── World-specific vibration patterns ───
const PATTERNS: Record<CoverStyleId, Partial<Record<HapticEvent, number | number[]>>> = {
  stone: {
    stroke: [10, 5, 10, 5, 10],   // Strong rapid bursts
    erase: [8, 4, 8],
  },
  archive: {
    stroke: [20],                  // Single soft vibration
    stamp: [30],                   // Firm stamp
  },
  "1980": {
    stroke: [5],                   // Very subtle
    erase: [8, 3, 8],
  },
  "1990": {
    stroke: [8],
  },
  "2000": {
    sticker_place: [15],           // "Tok"
    sticker_peel: [5, 5, 10],
    stroke: [8],
  },
  "1950": {
    stroke: [3],                   // Ultra subtle
  },
  "2010": {
    // Minimal: no vibration
  },
};

export function triggerHaptic(world: CoverStyleId, event: HapticEvent) {
  const worldPatterns = PATTERNS[world];
  if (!worldPatterns) return;
  const pattern = worldPatterns[event];
  if (pattern !== undefined) {
    vibrate(pattern);
  }
}
