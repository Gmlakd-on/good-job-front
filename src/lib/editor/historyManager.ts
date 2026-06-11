import type { StrokeData } from "./worldInterface";

const MAX_HISTORY = 50;

export interface HistoryState {
  past: StrokeData[][];
  future: StrokeData[][];
}

export function createHistory(): HistoryState {
  return { past: [], future: [] };
}

/** Push current strokes to history before a change */
export function pushHistory(
  history: HistoryState,
  currentStrokes: StrokeData[]
): HistoryState {
  const past = [...history.past, currentStrokes];
  // Trim if exceeding max
  if (past.length > MAX_HISTORY) {
    past.splice(0, past.length - MAX_HISTORY);
  }
  return { past, future: [] }; // Clear future on new action
}

/** Undo: pop from past, push current to future */
export function undo(
  history: HistoryState,
  currentStrokes: StrokeData[]
): { history: HistoryState; strokes: StrokeData[] } | null {
  if (history.past.length === 0) return null;

  const newPast = [...history.past];
  const restored = newPast.pop()!;

  return {
    history: {
      past: newPast,
      future: [...history.future, currentStrokes],
    },
    strokes: restored,
  };
}

/** Redo: pop from future, push current to past */
export function redo(
  history: HistoryState,
  currentStrokes: StrokeData[]
): { history: HistoryState; strokes: StrokeData[] } | null {
  if (history.future.length === 0) return null;

  const newFuture = [...history.future];
  const restored = newFuture.pop()!;

  return {
    history: {
      past: [...history.past, currentStrokes],
      future: newFuture,
    },
    strokes: restored,
  };
}

export function canUndo(history: HistoryState): boolean {
  return history.past.length > 0;
}

export function canRedo(history: HistoryState): boolean {
  return history.future.length > 0;
}
