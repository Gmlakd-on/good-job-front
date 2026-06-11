/**
 * tapeSystem.ts — Kitsch World decorative masking tape strips
 * Semi-transparent colored tape with torn-edge texture
 */

export interface TapeStrip {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  color: string;
  opacity: number;
  pattern: "solid" | "stripe" | "dot" | "check";
}

const TAPE_COLORS = [
  "rgba(255, 182, 193, 0.55)",  // pastel pink
  "rgba(173, 216, 230, 0.55)",  // baby blue
  "rgba(255, 255, 180, 0.50)",  // lemon
  "rgba(200, 230, 200, 0.50)",  // mint
  "rgba(230, 200, 255, 0.55)",  // lavender
  "rgba(255, 218, 185, 0.50)",  // peach
];

const TAPE_PATTERNS: TapeStrip["pattern"][] = ["solid", "stripe", "dot", "check"];

let _tapeCounter = 0;

export function createTapeStrip(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width = 24
): TapeStrip {
  _tapeCounter++;
  return {
    id: `tape_${Date.now()}_${_tapeCounter}`,
    x1, y1, x2, y2,
    width,
    color: TAPE_COLORS[Math.floor(Math.random() * TAPE_COLORS.length)],
    opacity: 0.5 + Math.random() * 0.15,
    pattern: TAPE_PATTERNS[Math.floor(Math.random() * TAPE_PATTERNS.length)],
  };
}

/**
 * Draw a tape strip with torn-edge effect.
 */
export function drawTapeStrip(
  ctx: CanvasRenderingContext2D,
  tape: TapeStrip
) {
  const dx = tape.x2 - tape.x1;
  const dy = tape.y2 - tape.y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(tape.x1, tape.y1);
  ctx.rotate(angle);
  ctx.globalAlpha = tape.opacity;

  // Main tape body
  ctx.fillStyle = tape.color;

  // Torn edge path
  ctx.beginPath();
  ctx.moveTo(0, -tape.width / 2);

  // Top edge — jagged
  const step = 4;
  for (let x = 0; x <= len; x += step) {
    const jag = (Math.random() - 0.5) * 3;
    ctx.lineTo(x, -tape.width / 2 + jag);
  }

  // Right end
  ctx.lineTo(len, tape.width / 2);

  // Bottom edge — jagged
  for (let x = len; x >= 0; x -= step) {
    const jag = (Math.random() - 0.5) * 3;
    ctx.lineTo(x, tape.width / 2 + jag);
  }

  ctx.closePath();
  ctx.fill();

  // Pattern overlay
  if (tape.pattern === "stripe") {
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    for (let x = 0; x < len; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, -tape.width / 2);
      ctx.lineTo(x, tape.width / 2);
      ctx.stroke();
    }
  } else if (tape.pattern === "dot") {
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    for (let x = 4; x < len; x += 8) {
      for (let y = -tape.width / 2 + 4; y < tape.width / 2; y += 8) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (tape.pattern === "check") {
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 0.8;
    for (let x = 0; x < len; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, -tape.width / 2);
      ctx.lineTo(x + 8, tape.width / 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}
