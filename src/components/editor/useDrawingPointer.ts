import { useRef, useCallback, type PointerEvent, type RefObject } from "react";
import type { CoverStyleId } from "@/components/book-ui/bookTypes";
import type {
  WorldComponentHandle,
  StrokePoint,
  StrokeData,
} from "@/lib/editor/worldInterface";
import type { EditorStoreState } from "@/lib/editor/editorStore";
import { triggerHaptic } from "@/lib/editor/hapticEngine";

// EditorActions의 필요한 메서드만 인터페이스로 정의 (ISP)
interface DrawingActions {
  addStroke: (stroke: StrokeData) => void;
  eraseStroke: (strokeId: string) => void;
}

// ── Erase style per world ──
const ERASE_STYLES: Record<CoverStyleId, "dust" | "fade" | "peel" | "dissolve" | "clean"> = {
  stone: "dust",
  archive: "fade",
  "1950": "fade",
  "1980": "clean",
  "1990": "dissolve",
  "2000": "peel",
  "2010": "clean",
};

// ── Hit testing for eraser ──
const BASE_HIT_RADIUS = 28;
const STICKER_HIT_RADIUS = 42;

function distanceSquared(a: StrokePoint, b: StrokePoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function distanceSquaredToSegment(pt: StrokePoint, a: StrokePoint, b: StrokePoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return distanceSquared(pt, a);
  }

  const t = Math.max(0, Math.min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / lengthSquared));
  const projected = {
    ...pt,
    x: a.x + t * dx,
    y: a.y + t * dy,
  };

  return distanceSquared(pt, projected);
}

function isPointInsideOutline(pt: StrokePoint, outline: number[][]): boolean {
  if (outline.length < 3) return false;

  let inside = false;

  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const xi = outline[i][0];
    const yi = outline[i][1];
    const xj = outline[j][0];
    const yj = outline[j][1];
    const intersects = yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

function getStrokeHitRadius(stroke: StrokeData): number {
  if (stroke.tool === "sticker_stamp" || stroke.metadata?.type === "sticker") {
    return STICKER_HIT_RADIUS;
  }

  return Math.max(BASE_HIT_RADIUS, stroke.size * 3 + 12);
}

function isPointNearStroke(pt: StrokePoint, stroke: StrokeData): boolean {
  const hitRadius = getStrokeHitRadius(stroke);
  const hitRadiusSquared = hitRadius * hitRadius;

  if (isPointInsideOutline(pt, stroke.outline)) {
    return true;
  }

  if (stroke.points.length === 1) {
    return distanceSquared(pt, stroke.points[0]) <= hitRadiusSquared;
  }

  for (let i = 1; i < stroke.points.length; i++) {
    if (distanceSquaredToSegment(pt, stroke.points[i - 1], stroke.points[i]) <= hitRadiusSquared) {
      return true;
    }
  }

  return false;
}

function findHitStroke(
  pt: StrokePoint,
  strokes: StrokeData[],
  ignoredStrokeIds: ReadonlySet<string>,
): StrokeData | null {
  for (let i = strokes.length - 1; i >= 0; i--) {
    const stroke = strokes[i];

    if (ignoredStrokeIds.has(stroke.id)) continue;
    if (isPointNearStroke(pt, stroke)) return stroke;
  }

  return null;
}

// ── Hook ──
export function useDrawingPointer(
  coverStyle: CoverStyleId,
  state: EditorStoreState,
  actions: DrawingActions,
  worldRef: RefObject<WorldComponentHandle | null>,
) {
  const isDrawing = useRef(false);
  const erasedStrokeIdsRef = useRef<Set<string>>(new Set());
  const lastErasePointRef = useRef<StrokePoint | null>(null);

  const pointerToStrokePoint = useCallback(
    (e: PointerEvent): StrokePoint => {
      const rect = e.currentTarget.getBoundingClientRect();

      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure || 0.5,
        tiltX: e.tiltX || 0,
        tiltY: e.tiltY || 0,
        timestamp: Date.now(),
      };
    },
    [],
  );

  const eraseAtPoint = useCallback(
    (pt: StrokePoint) => {
      const renderer = worldRef.current?.renderer;
      if (!renderer) return;

      const hitStroke = findHitStroke(pt, state.strokes, erasedStrokeIdsRef.current);
      if (!hitStroke) return;

      erasedStrokeIdsRef.current.add(hitStroke.id);
      renderer.eraseStroke(hitStroke.id, ERASE_STYLES[coverStyle]);
      actions.eraseStroke(hitStroke.id);
      triggerHaptic(coverStyle, "erase");
    },
    [actions, coverStyle, state.strokes, worldRef],
  );

  const eraseBetweenPoints = useCallback(
    (from: StrokePoint, to: StrokePoint) => {
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      const sampleCount = Math.max(1, Math.ceil(distance / (BASE_HIT_RADIUS * 0.75)));

      for (let i = 0; i <= sampleCount; i++) {
        const t = i / sampleCount;
        eraseAtPoint({
          ...to,
          x: from.x + (to.x - from.x) * t,
          y: from.y + (to.y - from.y) * t,
        });
      }
    },
    [eraseAtPoint],
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (state.editorMode !== "draw") return;
      const renderer = worldRef.current?.renderer;
      if (!renderer) return;

      e.preventDefault();
      isDrawing.current = true;
      erasedStrokeIdsRef.current.clear();
      e.currentTarget.setPointerCapture(e.pointerId);

      const pt = pointerToStrokePoint(e);

      if (state.selectedTool.id === "eraser") {
        lastErasePointRef.current = pt;
        eraseAtPoint(pt);
        return;
      }

      renderer.beginStroke(pt, state.selectedTool);
      triggerHaptic(coverStyle, "stroke");

      if (state.selectedTool.id === "sticker_stamp") {
        const stroke = renderer.endStroke();
        if (stroke) {
          actions.addStroke(stroke);
          triggerHaptic(coverStyle, "sticker_place");
        }
        isDrawing.current = false;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      }
    },
    [state.editorMode, state.selectedTool, coverStyle, actions, pointerToStrokePoint, eraseAtPoint, worldRef],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDrawing.current || state.editorMode !== "draw") return;
      const renderer = worldRef.current?.renderer;
      if (!renderer) return;

      e.preventDefault();
      const pt = pointerToStrokePoint(e);

      if (state.selectedTool.id === "eraser") {
        if (lastErasePointRef.current) {
          eraseBetweenPoints(lastErasePointRef.current, pt);
        } else {
          eraseAtPoint(pt);
        }
        lastErasePointRef.current = pt;
        return;
      }

      renderer.continueStroke(pt);
    },
    [state.editorMode, state.selectedTool.id, pointerToStrokePoint, eraseAtPoint, eraseBetweenPoints, worldRef],
  );

  const handlePointerUp = useCallback(
    (e?: PointerEvent) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;

      if (e?.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      if (state.selectedTool.id === "eraser") {
        erasedStrokeIdsRef.current.clear();
        lastErasePointRef.current = null;
        return;
      }

      const renderer = worldRef.current?.renderer;
      if (!renderer) return;

      const stroke = renderer.endStroke();
      if (stroke) {
        actions.addStroke(stroke);
      }
    },
    [actions, state.selectedTool.id, worldRef],
  );

  return { handlePointerDown, handlePointerMove, handlePointerUp };
}

export { ERASE_STYLES };
