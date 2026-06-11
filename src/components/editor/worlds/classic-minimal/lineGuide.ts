/**
 * lineGuide.ts — Classic World (2000s) writing guide lines
 * Subtle ruled lines + optional margin for structured journal feel
 */

export interface LineGuideConfig {
  lineSpacing: number;     // px between lines
  marginLeft: number;      // px, red margin line
  topPadding: number;      // px before first line
  lineColor: string;
  marginColor: string;
  lineWidth: number;
}

const DEFAULT_CONFIG: LineGuideConfig = {
  lineSpacing: 30,
  marginLeft: 48,
  topPadding: 56,
  lineColor: "rgba(150, 170, 200, 0.18)",
  marginColor: "rgba(200, 100, 100, 0.15)",
  lineWidth: 0.5,
};

export function getLineGuideConfig(overrides?: Partial<LineGuideConfig>): LineGuideConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

/**
 * Draw ruled lines onto the canvas.
 */
export function drawLineGuide(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: LineGuideConfig = DEFAULT_CONFIG
) {
  ctx.save();

  // Horizontal ruled lines
  ctx.strokeStyle = config.lineColor;
  ctx.lineWidth = config.lineWidth;

  for (let y = config.topPadding; y < height; y += config.lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(config.marginLeft - 8, y);
    ctx.lineTo(width - 24, y);
    ctx.stroke();
  }

  // Vertical margin line
  ctx.strokeStyle = config.marginColor;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(config.marginLeft, config.topPadding - 16);
  ctx.lineTo(config.marginLeft, height - 16);
  ctx.stroke();

  ctx.restore();
}

/**
 * Snap a Y coordinate to the nearest line.
 * Useful for text cursor alignment.
 */
export function snapToLine(y: number, config: LineGuideConfig = DEFAULT_CONFIG): number {
  const lineIndex = Math.round((y - config.topPadding) / config.lineSpacing);
  return config.topPadding + lineIndex * config.lineSpacing;
}
