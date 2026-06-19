import { useRef, useCallback } from "react";
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
  stone:   "dust",
  archive: "fade",
  "1950":  "fade",
  "1980":  "clean",
  "1990":  "dissolve",
  "2000":  "peel",
  "2010":  "clean",
};

// ── Hit testing for eraser ──
const HIT_RADIUS = 20;

function findHitStroke(pt: StrokePoint, strokes: StrokeData[]): StrokeData | null {
  for (let i = strokes.length - 1; i >= 0; i--) {
    const stroke = strokes[i];
    for (const sp of stroke.points) {
      const dx = sp.x - pt.x;
      const dy = sp.y - pt.y;
      if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) {
        return stroke;
      }
    }
  }
  return null;
}

// ── Hook ──
export function useDrawingPointer(
  coverStyle: CoverStyleId,
  state: EditorStoreState,
  actions: DrawingActions,
  worldRef: React.RefObject<WorldComponentHandle | null>,
) {
  const isDrawing = useRef(false);

  const pointerToStrokePoint = useCallback(
    (e: React.PointerEvent): StrokePoint => ({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
      pressure: e.pressure || 0.5,
      tiltX: e.tiltX || 0,
      tiltY: e.tiltY || 0,
      timestamp: Date.now(),
    }),
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (state.editorMode !== "draw") return;
      const renderer = worldRef.current?.renderer;
      if (!renderer) return;

      isDrawing.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const pt = pointerToStrokePoint(e);

      if (state.selectedTool.id === "eraser") {
        const hitStroke = findHitStroke(pt, state.strokes);
        if (hitStroke) {
          renderer.eraseStroke(hitStroke.id, ERASE_STYLES[coverStyle]);
          actions.eraseStroke(hitStroke.id);
          triggerHaptic(coverStyle, "erase");
        }
        isDrawing.current = false;
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
      }
    },
    [state.editorMode, state.selectedTool, state.strokes, coverStyle, actions, pointerToStrokePoint, worldRef],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing.current || state.editorMode !== "draw") return;
      const renderer = worldRef.current?.renderer;
      if (!renderer) return;
      renderer.continueStroke(pointerToStrokePoint(e));
    },
    [state.editorMode, pointerToStrokePoint, worldRef],
  );

  const handlePointerUp = useCallback(
    () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;

      const renderer = worldRef.current?.renderer;
      if (!renderer) return;

      const stroke = renderer.endStroke();
      if (stroke) {
        actions.addStroke(stroke);
      }
    },
    [actions, worldRef],
  );

  return { handlePointerDown, handlePointerMove, handlePointerUp };
}

export { ERASE_STYLES };
