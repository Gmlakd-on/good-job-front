import type { StrokeData } from "./worldInterface";
import { regenerateOutline } from "./strokeEngine";

/** Serializable stroke (outline excluded — regenerated on restore) */
interface SerializedStroke {
  id: string;
  tool: string;
  points: { x: number; y: number; pressure: number; tiltX: number; tiltY: number; timestamp: number }[];
  color: string;
  size: number;
  opacity: number;
  metadata: Record<string, unknown>;
}

/** Convert strokes to JSON-safe format (no outline) */
export function serializeStrokes(strokes: StrokeData[]): SerializedStroke[] {
  return strokes.map((s) => ({
    id: s.id,
    tool: s.tool,
    points: s.points.map((p) => ({
      x: p.x,
      y: p.y,
      pressure: p.pressure,
      tiltX: p.tiltX,
      tiltY: p.tiltY,
      timestamp: p.timestamp,
    })),
    color: s.color,
    size: s.size,
    opacity: s.opacity,
    metadata: s.metadata,
  }));
}

/** Restore strokes from JSON (regenerate outlines) */
export function deserializeStrokes(data: SerializedStroke[]): StrokeData[] {
  return data.map((s) =>
    regenerateOutline({
      id: s.id,
      tool: s.tool,
      points: s.points,
      outline: [],
      color: s.color,
      size: s.size,
      opacity: s.opacity,
      metadata: s.metadata || {},
    })
  );
}

/** Full editor state for saving */
export interface EditorSavePayload {
  plainText: string;
  strokes: SerializedStroke[];
  version: number;
}

/** Create save payload */
export function createSavePayload(
  plainText: string,
  strokes: StrokeData[]
): EditorSavePayload {
  return {
    plainText,
    strokes: serializeStrokes(strokes),
    version: 1,
  };
}

/** Restore editor state from payload */
export function restoreFromPayload(
  payload: EditorSavePayload
): { plainText: string; strokes: StrokeData[] } {
  return {
    plainText: payload.plainText,
    strokes: deserializeStrokes(payload.strokes),
  };
}
