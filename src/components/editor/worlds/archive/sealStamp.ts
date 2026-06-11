/**
 * sealStamp.ts — 전서체 인장(도장) 시스템
 *
 * 미리 정의된 전서체 문양 3종을 탭으로 찍는다.
 * 빨간색(#c0392b) + 약간의 불규칙 인쇄 효과
 */

// ── 3종 도장 문양 (전서체 느낌의 SVG path) ──
const SEAL_DESIGNS: { name: string; paths: string[]; viewBox: string }[] = [
  {
    // 福 (복) — 간략화된 전서체
    name: "복",
    viewBox: "0 0 80 80",
    paths: [
      // outer frame
      "M6 6h68v68H6z",
      // inner strokes approximating 福
      "M20 18v44 M20 40h40 M40 18v22 M40 50v12 M60 18v44 M28 26h10 M50 26h8 M28 56h10 M50 56h8",
    ],
  },
  {
    // 壽 (수) — 간략화
    name: "수",
    viewBox: "0 0 80 80",
    paths: [
      "M6 6h68v68H6z",
      "M20 20h40 M40 20v40 M24 32h32 M24 44h32 M30 56h20 M20 60h40",
    ],
  },
  {
    // 喜 (희) — 간략화 쌍희
    name: "희",
    viewBox: "0 0 80 80",
    paths: [
      "M6 6h68v68H6z",
      "M16 18h20 M26 18v20 M16 28h20 M16 38h20 M48 18h20 M58 18v20 M48 28h20 M48 38h20 M26 44v20 M58 44v20 M20 52h14 M50 52h14 M34 60h14",
    ],
  },
];

const SEAL_COLOR = "#c0392b";
const SEAL_SIZE = 64; // px

export interface SealStampOptions {
  designIndex?: number; // 0 | 1 | 2
  size?: number;
  rotation?: number; // degrees
}

/**
 * 도장을 캔버스에 찍는다.
 */
export function stampSeal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: SealStampOptions = {}
): void {
  const design = SEAL_DESIGNS[opts.designIndex ?? 0];
  const size = opts.size ?? SEAL_SIZE;
  const rotation = opts.rotation ?? (Math.random() * 4 - 2); // slight random tilt

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  const half = size / 2;
  const scale = size / 80; // viewBox is 80x80

  // Draw seal with slight irregularity
  ctx.globalAlpha = 0.82 + Math.random() * 0.12;
  ctx.globalCompositeOperation = "multiply";

  // Background square with rough edges
  ctx.fillStyle = SEAL_COLOR;
  ctx.beginPath();
  drawRoughRect(ctx, -half, -half, size, size, 1.5);
  ctx.fill();

  // Cut out inner area (leaving frame)
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.rect(-half + 5 * scale, -half + 5 * scale, size - 10 * scale, size - 10 * scale);
  ctx.fill();

  // Redraw strokes in red
  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = SEAL_COLOR;
  ctx.fillStyle = SEAL_COLOR;
  ctx.lineWidth = 2.5 * scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Frame
  ctx.beginPath();
  drawRoughRect(ctx, -half + 4 * scale, -half + 4 * scale, size - 8 * scale, size - 8 * scale, 1);
  ctx.stroke();

  // Parse and draw character strokes
  for (const pathStr of design.paths) {
    if (pathStr.includes("h") || pathStr.includes("v") || pathStr.includes("M")) {
      drawSealStrokes(ctx, pathStr, -half, -half, scale);
    }
  }

  // Add printing imperfections — random faded spots
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 8; i++) {
    const rx = (Math.random() - 0.5) * size;
    const ry = (Math.random() - 0.5) * size;
    const rr = Math.random() * 4 + 1;
    ctx.globalAlpha = Math.random() * 0.3;
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 도장 디자인 목록 반환
 */
export function getSealDesigns(): { name: string; index: number }[] {
  return SEAL_DESIGNS.map((d, i) => ({ name: d.name, index: i }));
}

/**
 * 도장 미리보기를 작은 캔버스에 그린다
 */
export function renderSealPreview(
  ctx: CanvasRenderingContext2D,
  designIndex: number,
  x: number,
  y: number,
  size: number
): void {
  stampSeal(ctx, x + size / 2, y + size / 2, { designIndex, size, rotation: 0 });
}

// ── Helpers ──

function drawRoughRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  roughness: number
): void {
  const r = roughness;
  ctx.moveTo(x + rand(r), y + rand(r));
  ctx.lineTo(x + w + rand(r), y + rand(r));
  ctx.lineTo(x + w + rand(r), y + h + rand(r));
  ctx.lineTo(x + rand(r), y + h + rand(r));
  ctx.closePath();
}

function rand(max: number): number {
  return (Math.random() - 0.5) * max * 2;
}

function drawSealStrokes(
  ctx: CanvasRenderingContext2D,
  pathStr: string,
  offsetX: number,
  offsetY: number,
  scale: number
): void {
  // Simple SVG-like path parser for M, h, v commands
  const commands = pathStr.split(/(?=[MhvHVz])/);
  let cx = 0,
    cy = 0;

  ctx.beginPath();
  for (const cmd of commands) {
    const type = cmd[0];
    const nums = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number);

    switch (type) {
      case "M":
        for (let i = 0; i < nums.length; i += 2) {
          cx = nums[i];
          cy = nums[i + 1];
          if (i === 0) {
            ctx.moveTo(offsetX + cx * scale + rand(0.5), offsetY + cy * scale + rand(0.5));
          } else {
            ctx.lineTo(offsetX + cx * scale + rand(0.5), offsetY + cy * scale + rand(0.5));
          }
        }
        break;
      case "h":
        cx += nums[0];
        ctx.lineTo(offsetX + cx * scale + rand(0.5), offsetY + cy * scale + rand(0.5));
        break;
      case "H":
        cx = nums[0];
        ctx.lineTo(offsetX + cx * scale + rand(0.5), offsetY + cy * scale + rand(0.5));
        break;
      case "v":
        cy += nums[0];
        ctx.lineTo(offsetX + cx * scale + rand(0.5), offsetY + cy * scale + rand(0.5));
        break;
      case "V":
        cy = nums[0];
        ctx.lineTo(offsetX + cx * scale + rand(0.5), offsetY + cy * scale + rand(0.5));
        break;
    }
  }
  ctx.stroke();
}
