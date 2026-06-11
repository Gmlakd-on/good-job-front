"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import type { StrokeData, ToolConfig } from "./worldInterface";
import type { CoverStyleId } from "@/components/book-ui/bookTypes";
import {
  createHistory,
  pushHistory,
  undo as historyUndo,
  redo as historyRedo,
  canUndo,
  canRedo,
  type HistoryState,
} from "./historyManager";
import { AutoSave, type SaveStatus } from "./autoSave";

// ─── State ───
export interface EditorStoreState {
  coverStyle: CoverStyleId;
  strokes: StrokeData[];
  activeStroke: StrokeData | null;
  selectedTool: ToolConfig;
  editorMode: "text" | "draw";
  plainText: string;
  history: HistoryState;
  saveStatus: SaveStatus;
  isDirty: boolean;
  soundEnabled: boolean;
}

// ─── Actions ───
type EditorAction =
  | { type: "ADD_STROKE"; stroke: StrokeData }
  | { type: "SET_ACTIVE_STROKE"; stroke: StrokeData | null }
  | { type: "ERASE_STROKE"; strokeId: string }
  | { type: "SET_STROKES"; strokes: StrokeData[] }
  | { type: "SET_TOOL"; tool: ToolConfig }
  | { type: "SET_MODE"; mode: "text" | "draw" }
  | { type: "SET_TEXT"; text: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_SAVE_STATUS"; status: SaveStatus }
  | { type: "TOGGLE_SOUND" }
  | { type: "LOAD_STROKES"; strokes: StrokeData[] };

function editorReducer(state: EditorStoreState, action: EditorAction): EditorStoreState {
  switch (action.type) {
    case "ADD_STROKE": {
      const history = pushHistory(state.history, state.strokes);
      return {
        ...state,
        strokes: [...state.strokes, action.stroke],
        activeStroke: null,
        history,
        isDirty: true,
      };
    }
    case "SET_ACTIVE_STROKE":
      return { ...state, activeStroke: action.stroke };

    case "ERASE_STROKE": {
      const history = pushHistory(state.history, state.strokes);
      return {
        ...state,
        strokes: state.strokes.filter((s) => s.id !== action.strokeId),
        history,
        isDirty: true,
      };
    }
    case "SET_STROKES":
      return { ...state, strokes: action.strokes, isDirty: true };

    case "SET_TOOL":
      return { ...state, selectedTool: action.tool };

    case "SET_MODE":
      return { ...state, editorMode: action.mode };

    case "SET_TEXT":
      return { ...state, plainText: action.text, isDirty: true };

    case "UNDO": {
      const result = historyUndo(state.history, state.strokes);
      if (!result) return state;
      return { ...state, strokes: result.strokes, history: result.history, isDirty: true };
    }
    case "REDO": {
      const result = historyRedo(state.history, state.strokes);
      if (!result) return state;
      return { ...state, strokes: result.strokes, history: result.history, isDirty: true };
    }
    case "SET_SAVE_STATUS":
      return { ...state, saveStatus: action.status, isDirty: action.status === "saved" ? false : state.isDirty };

    case "TOGGLE_SOUND":
      return { ...state, soundEnabled: !state.soundEnabled };

    case "LOAD_STROKES":
      return { ...state, strokes: action.strokes, history: createHistory(), isDirty: false };

    default:
      return state;
  }
}

// ─── Hook ───
export function useEditorStore(
  coverStyle: CoverStyleId,
  initialTool: ToolConfig,
  initialMode: "text" | "draw",
  diaryId?: string
) {
  const [state, dispatch] = useReducer(editorReducer, {
    coverStyle,
    strokes: [],
    activeStroke: null,
    selectedTool: initialTool,
    editorMode: initialMode,
    plainText: "",
    history: createHistory(),
    saveStatus: "idle",
    isDirty: false,
    soundEnabled: true,
  });

  const autoSaveRef = useRef<AutoSave | null>(null);

  // Init auto-save
  useEffect(() => {
    const as = new AutoSave((status) => dispatch({ type: "SET_SAVE_STATUS", status }));
    if (diaryId) as.setDiaryId(diaryId);
    autoSaveRef.current = as;
    return () => as.destroy();
  }, [diaryId]);

  // Trigger auto-save on dirty
  useEffect(() => {
    if (state.isDirty && autoSaveRef.current) {
      autoSaveRef.current.schedule(state.plainText, state.strokes);
    }
  }, [state.isDirty, state.plainText, state.strokes]);

  // Actions
  const addStroke = useCallback((stroke: StrokeData) => {
    dispatch({ type: "ADD_STROKE", stroke });
  }, []);

  const eraseStroke = useCallback((strokeId: string) => {
    dispatch({ type: "ERASE_STROKE", strokeId });
  }, []);

  const setTool = useCallback((tool: ToolConfig) => {
    dispatch({ type: "SET_TOOL", tool });
  }, []);

  const setMode = useCallback((mode: "text" | "draw") => {
    dispatch({ type: "SET_MODE", mode });
  }, []);

  const setText = useCallback((text: string) => {
    dispatch({ type: "SET_TEXT", text });
  }, []);

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);

  const toggleSound = useCallback(() => dispatch({ type: "TOGGLE_SOUND" }), []);

  const loadStrokes = useCallback((strokes: StrokeData[]) => {
    dispatch({ type: "LOAD_STROKES", strokes });
  }, []);

  return {
    state,
    actions: {
      addStroke,
      eraseStroke,
      setTool,
      setMode,
      setText,
      undo,
      redo,
      toggleSound,
      loadStrokes,
      canUndo: canUndo(state.history),
      canRedo: canRedo(state.history),
    },
  };
}
