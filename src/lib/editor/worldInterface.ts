import type { CoverStyleId } from "@/components/book-ui/bookTypes";

// ─── Stroke Point (extended with tilt + timestamp) ───
export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;       // 0~1
  tiltX: number;          // -90~90
  tiltY: number;
  timestamp: number;
}

// ─── Stroke (extended with outline from perfect-freehand) ───
export interface StrokeData {
  id: string;
  tool: string;
  points: StrokePoint[];
  outline: number[][];    // perfect-freehand generated
  color: string;
  size: number;
  opacity: number;
  metadata: Record<string, unknown>;
}

// ─── Tool Config ───
export interface ToolConfig {
  id: string;
  color: string;
  size: number;
  opacity: number;
  custom: Record<string, unknown>;
}

// ─── World Config (for renderer init) ───
export interface WorldRendererConfig {
  id: CoverStyleId;
  width: number;
  height: number;
  devicePixelRatio: number;
}

// ─── Erase Style ───
export type EraseStyle = "dust" | "fade" | "peel" | "dissolve" | "clean";

// ─── WorldRenderer Interface — all worlds implement this ───
export interface WorldRenderer {
  /** Initialize renderer with canvas and config */
  init(canvas: HTMLCanvasElement, config: WorldRendererConfig): void;

  /** Handle resize */
  resize(width: number, height: number): void;

  /** Begin a new stroke */
  beginStroke(point: StrokePoint, tool: ToolConfig): void;

  /** Continue current stroke */
  continueStroke(point: StrokePoint): void;

  /** End stroke and return the completed stroke data */
  endStroke(): StrokeData | null;

  /** Re-render all strokes (e.g. after undo/redo) */
  renderAll(strokes: StrokeData[]): void;

  /** Erase a specific stroke with animation */
  eraseStroke(strokeId: string, style: EraseStyle): void;

  /** Clean up resources */
  destroy(): void;
}

// ─── React component handle for forwardRef world components ───
export interface WorldComponentHandle {
  renderer: WorldRenderer | null;
}
