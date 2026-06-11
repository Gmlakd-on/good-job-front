/**
 * colorBrush.ts — Pop World (1990s) color brush system
 * Bold, saturated strokes with optional halftone overlay
 */

export interface ColorBrushConfig {
  hue: number;        // 0-360
  saturation: number;  // 0-100
  lightness: number;   // 0-100
  halftone: boolean;
  dotSpacing: number;
}

const POP_PALETTE = [
  { hue: 340, saturation: 90, lightness: 55 },  // hot pink
  { hue: 45,  saturation: 95, lightness: 55 },  // electric yellow
  { hue: 195, saturation: 90, lightness: 50 },  // cyan pop
  { hue: 130, saturation: 80, lightness: 50 },  // neon green
  { hue: 275, saturation: 85, lightness: 55 },  // vibrant purple
  { hue: 15,  saturation: 90, lightness: 55 },  // tangerine
];

export function getPopPalette() {
  return POP_PALETTE;
}

export function hslToString(h: number, s: number, l: number, a = 1): string {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

/**
 * Draw a halftone pattern over a region for retro pop effect.
 */
export function drawHalftoneOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  dotSpacing = 6,
  dotRadius = 1.5,
  color = "rgba(0,0,0,0.12)"
) {
  ctx.save();
  ctx.fillStyle = color;
  for (let dy = 0; dy < height; dy += dotSpacing) {
    const offsetX = (Math.floor(dy / dotSpacing) % 2) * (dotSpacing / 2);
    for (let dx = 0; dx < width; dx += dotSpacing) {
      ctx.beginPath();
      ctx.arc(x + dx + offsetX, y + dy, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Apply pop-style bold stroke rendering:
 * thick outline + fill with slight drop shadow
 */
export function applyPopStrokeStyle(
  ctx: CanvasRenderingContext2D,
  color: string,
  size: number
) {
  // drop shadow
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = size * 0.3;
  ctx.shadowOffsetX = size * 0.08;
  ctx.shadowOffsetY = size * 0.08;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

export function clearPopShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}
