/**
 * stickerSystem.ts — Kitsch World (1980s) sticker + stamp system
 * Stickers can be placed, rotated, scaled, and "peeled" off
 */

export interface StickerDef {
  id: string;
  emoji: string;
  label: string;
  scale: number;
}

export interface PlacedSticker {
  id: string;
  stickerId: string;
  emoji: string;
  x: number;
  y: number;
  rotation: number;     // degrees
  scale: number;
  opacity: number;
  timestamp: number;
}

const KITSCH_STICKERS: StickerDef[] = [
  { id: "heart",   emoji: "❤️",  label: "하트",   scale: 1.0 },
  { id: "star",    emoji: "⭐",  label: "별",     scale: 1.0 },
  { id: "sparkle", emoji: "✨",  label: "반짝",   scale: 0.9 },
  { id: "ribbon",  emoji: "🎀",  label: "리본",   scale: 1.0 },
  { id: "flower",  emoji: "🌸",  label: "꽃",     scale: 1.0 },
  { id: "clover",  emoji: "🍀",  label: "클로버", scale: 0.9 },
  { id: "moon",    emoji: "🌙",  label: "달",     scale: 1.0 },
  { id: "candy",   emoji: "🍬",  label: "사탕",   scale: 0.9 },
];

export function getKitschStickers(): StickerDef[] {
  return KITSCH_STICKERS;
}

let _stickerCounter = 0;

export function placeSticker(
  stickerId: string,
  x: number,
  y: number
): PlacedSticker | null {
  const def = KITSCH_STICKERS.find(s => s.id === stickerId);
  if (!def) return null;

  _stickerCounter++;
  return {
    id: `sticker_${Date.now()}_${_stickerCounter}`,
    stickerId: def.id,
    emoji: def.emoji,
    x,
    y,
    rotation: (Math.random() - 0.5) * 20,   // slight random tilt ±10°
    scale: def.scale * (0.9 + Math.random() * 0.2),
    opacity: 1,
    timestamp: Date.now(),
  };
}

/**
 * Draw a placed sticker onto a canvas context.
 * Uses emoji rendering with transform for rotation/scale.
 */
export function drawSticker(
  ctx: CanvasRenderingContext2D,
  sticker: PlacedSticker,
  baseSize = 32
) {
  ctx.save();
  ctx.translate(sticker.x, sticker.y);
  ctx.rotate((sticker.rotation * Math.PI) / 180);
  ctx.scale(sticker.scale, sticker.scale);
  ctx.globalAlpha = sticker.opacity;
  ctx.font = `${baseSize}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(sticker.emoji, 0, 0);
  ctx.restore();
}

/**
 * Animate peel-off for erasing a sticker.
 * Returns a sequence of opacity/scale/rotation frames.
 */
export function generatePeelFrames(
  sticker: PlacedSticker,
  totalFrames = 12
): Array<{ opacity: number; scale: number; rotation: number; offsetY: number }> {
  const frames: Array<{ opacity: number; scale: number; rotation: number; offsetY: number }> = [];
  for (let i = 0; i <= totalFrames; i++) {
    const t = i / totalFrames;
    const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
    frames.push({
      opacity: 1 - ease,
      scale: sticker.scale * (1 + ease * 0.3),
      rotation: sticker.rotation + ease * 25,
      offsetY: -ease * 30,
    });
  }
  return frames;
}
