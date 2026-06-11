import { getStroke } from "perfect-freehand";
import type { StrokePoint, StrokeData, ToolConfig } from "./worldInterface";

// ─── Tool-specific perfect-freehand options ───
const TOOL_OPTIONS: Record<string, Parameters<typeof getStroke>[1]> = {
  // Stone
  chisel:      { size: 6,  thinning: 0.3,  smoothing: 0.2, streamline: 0.3 },
  chisel_deep: { size: 10, thinning: 0.2,  smoothing: 0.15, streamline: 0.2 },
  // Archive
  brush:       { size: 8,  thinning: 0.65, smoothing: 0.5, streamline: 0.6, start: { taper: 30 }, end: { taper: 20 } },
  brush_light: { size: 6,  thinning: 0.7,  smoothing: 0.55, streamline: 0.65, start: { taper: 25 }, end: { taper: 15 } },
  brush_dark:  { size: 10, thinning: 0.6,  smoothing: 0.45, streamline: 0.55, start: { taper: 35 }, end: { taper: 25 } },
  // Sketch
  pencil_2h:   { size: 3,  thinning: 0.4,  smoothing: 0.3, streamline: 0.4 },
  pencil_hb:   { size: 4,  thinning: 0.35, smoothing: 0.35, streamline: 0.45 },
  pencil_2b:   { size: 6,  thinning: 0.3,  smoothing: 0.4, streamline: 0.5 },
  pencil_4b:   { size: 8,  thinning: 0.25, smoothing: 0.45, streamline: 0.55 },
  // Pop / Kitsch
  pastel:         { size: 12, thinning: 0.1, smoothing: 0.6, streamline: 0.7 },
  ballpoint_color:{ size: 3,  thinning: 0.2, smoothing: 0.3, streamline: 0.4 },
  color_pen:      { size: 3,  thinning: 0.15, smoothing: 0.3, streamline: 0.4 },
  // Classic / Minimal
  fountain_pen: { size: 3,  thinning: 0.5,  smoothing: 0.5, streamline: 0.6, start: { taper: 10 }, end: { taper: 8 } },
  ink_navy:     { size: 3,  thinning: 0.5,  smoothing: 0.5, streamline: 0.6, start: { taper: 10 }, end: { taper: 8 } },
  ink_brown:    { size: 3,  thinning: 0.5,  smoothing: 0.5, streamline: 0.6, start: { taper: 10 }, end: { taper: 8 } },
  minimal_pen:  { size: 3,  thinning: 0.3,  smoothing: 0.4, streamline: 0.5 },
  // Eraser
  eraser: { size: 16, thinning: 0, smoothing: 0.5, streamline: 0.5 },
};

let strokeCounter = 0;

/** Generate a unique stroke ID */
export function generateStrokeId(): string {
  strokeCounter += 1;
  return `s_${Date.now()}_${strokeCounter}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Convert StrokePoints → perfect-freehand input format */
function toFreehandInput(points: StrokePoint[]): number[][] {
  return points.map((p) => [p.x, p.y, p.pressure]);
}

/** Get perfect-freehand outline for a set of points */
export function getStrokeOutline(
  points: StrokePoint[],
  toolId: string,
  sizeOverride?: number
): number[][] {
  const opts = { ...(TOOL_OPTIONS[toolId] || TOOL_OPTIONS.pencil_hb) };
  if (sizeOverride !== undefined) {
    opts.size = sizeOverride;
  }
  const input = toFreehandInput(points);
  if (input.length < 2) return [];
  return getStroke(input, opts);
}

/** Convert outline points to SVG path data */
export function outlineToSvgPath(outline: number[][]): string {
  if (outline.length < 2) return "";

  const d: string[] = [];
  d.push(`M ${outline[0][0].toFixed(2)} ${outline[0][1].toFixed(2)}`);

  for (let i = 1; i < outline.length - 1; i++) {
    const x0 = outline[i][0];
    const y0 = outline[i][1];
    const x1 = outline[i + 1][0];
    const y1 = outline[i + 1][1];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    d.push(`Q ${x0.toFixed(2)} ${y0.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`);
  }

  d.push("Z");
  return d.join(" ");
}

/** Fill a perfect-freehand outline onto a 2D canvas */
export function fillOutline(
  ctx: CanvasRenderingContext2D,
  outline: number[][],
  color: string,
  opacity: number
): void {
  if (outline.length < 2) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(outline[0][0], outline[0][1]);

  for (let i = 1; i < outline.length - 1; i++) {
    const x0 = outline[i][0];
    const y0 = outline[i][1];
    const x1 = outline[i + 1][0];
    const y1 = outline[i + 1][1];
    ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }

  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Create a full StrokeData from points and tool */
export function createStrokeData(
  points: StrokePoint[],
  tool: ToolConfig,
  metadata: Record<string, unknown> = {}
): StrokeData {
  const outline = getStrokeOutline(points, tool.id, tool.size);
  return {
    id: generateStrokeId(),
    tool: tool.id,
    points: [...points],
    outline,
    color: tool.color,
    size: tool.size,
    opacity: tool.opacity,
    metadata,
  };
}

/** Regenerate outline for a stroke (used when restoring from JSON) */
export function regenerateOutline(stroke: StrokeData): StrokeData {
  return {
    ...stroke,
    outline: getStrokeOutline(stroke.points, stroke.tool, stroke.size),
  };
}
