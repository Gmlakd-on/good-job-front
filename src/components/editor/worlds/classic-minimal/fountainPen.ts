/**
 * fountainPen.ts — Classic World (2000s) fountain pen simulation
 * Pressure-sensitive nib with ink flow variation
 */

export interface InkFlowState {
  inkLevel: number;       // 0-1, decreases with use
  lastRefill: number;     // timestamp
  flowRate: number;       // current flow multiplier
}

export interface NibConfig {
  angle: number;          // nib angle in degrees (typically 45)
  thinWidth: number;      // thinnest stroke width
  thickWidth: number;     // thickest stroke width
  inkColor: string;
}

const NIB_PRESETS: Record<string, NibConfig> = {
  fountain_pen: {
    angle: 45,
    thinWidth: 1.0,
    thickWidth: 4.5,
    inkColor: "#1a1a2e",
  },
  ink_navy: {
    angle: 45,
    thinWidth: 1.0,
    thickWidth: 4.0,
    inkColor: "#1b2a4a",
  },
  ink_brown: {
    angle: 50,
    thinWidth: 1.2,
    thickWidth: 5.0,
    inkColor: "#3c2415",
  },
};

export function getNibConfig(toolId: string): NibConfig {
  return NIB_PRESETS[toolId] || NIB_PRESETS.fountain_pen;
}

/**
 * Calculate stroke width based on pressure and nib angle.
 * The nib angle makes horizontal strokes thicker than vertical.
 */
export function calculateNibWidth(
  pressure: number,
  angle: number,        // stroke direction angle in radians
  nib: NibConfig
): number {
  // Nib effect: perpendicular to nib angle = thick, parallel = thin
  const nibAngleRad = (nib.angle * Math.PI) / 180;
  const angleDiff = Math.abs(Math.sin(angle - nibAngleRad));
  const nibFactor = 0.4 + angleDiff * 0.6;

  // Pressure mapping (slight exponential for natural feel)
  const pressureFactor = Math.pow(pressure, 0.7);

  const width = nib.thinWidth + (nib.thickWidth - nib.thinWidth) * pressureFactor * nibFactor;
  return Math.max(nib.thinWidth, width);
}

/**
 * Simulate ink flow variation — slight opacity fluctuation.
 * Creates organic feel of real fountain pen writing.
 */
export function calculateInkOpacity(
  pressure: number,
  speed: number,         // px per frame
  baseOpacity = 0.92
): number {
  // Fast strokes → slightly less ink
  const speedFactor = Math.max(0.7, 1 - speed * 0.003);
  // Low pressure → lighter ink
  const pressureFactor = 0.6 + pressure * 0.4;

  return Math.min(1, baseOpacity * speedFactor * pressureFactor);
}

/**
 * Generate ink pooling effect at start/end of strokes
 * where the pen pauses and ink accumulates.
 */
export function getInkPoolRadius(
  pressure: number,
  dwellTime: number     // milliseconds at roughly same position
): number {
  if (dwellTime < 100) return 0;
  const base = 1.5;
  const poolGrowth = Math.min(3, dwellTime / 300);
  return base + poolGrowth * pressure;
}
