"use client";

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type ComponentType,
} from "react";
import type { CoverStyleId } from "@/components/book-ui/bookTypes";
import type { ToolType } from "@/lib/editor/editorTypes";
import { WORLDS } from "@/lib/editor/editorTypes";
import type {
  ToolConfig,
  WorldComponentHandle,
} from "@/lib/editor/worldInterface";
import { useEditorStore } from "@/lib/editor/editorStore";
import { playSound, setMuted } from "@/lib/editor/audioEngine";
import { useDrawingPointer } from "./useDrawingPointer";
import EditorHeader from "./EditorHeader";
import EditorToolbar from "./EditorToolbar";

// ─── Dynamic World Imports (code splitting) ───
interface WorldComponentProps {
  ref?: React.Ref<WorldComponentHandle>;
  width: number;
  height: number;
  devicePixelRatio?: number;
}

const worldComponents: Record<
  CoverStyleId,
  () => Promise<{ default: ComponentType<WorldComponentProps> }>
> = {
  stone:   () => import("./worlds/StoneWorld"),
  archive: () => import("./worlds/ArchiveWorld"),
  "1950":  () => import("./worlds/SketchWorld"),
  "1980":  () => import("./worlds/KitschWorld"),
  "1990":  () => import("./worlds/PopWorld"),
  "2000":  () => import("./worlds/ClassicWorld"),
  "2010":  () => import("./worlds/MinimalWorld"),
};

function useLazyWorld(coverStyle: CoverStyleId) {
  const [compRef, setCompRef] = useState<{ C: ComponentType<WorldComponentProps> } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = worldComponents[coverStyle];
    if (!loader) return;
    loader().then((mod) => { if (!cancelled) setCompRef({ C: mod.default }); });
    return () => { cancelled = true; };
  }, [coverStyle]);

  return compRef;
}

// ─── Props ───
interface ImmersiveEditorProps {
  coverStyle: CoverStyleId;
  value: string;
  onChange: (text: string) => void;
  onSubmit?: () => void;
  diaryId?: string;
}

// ─── Component ───
export default function ImmersiveEditor({
  coverStyle,
  value,
  onChange,
  onSubmit,
  diaryId,
}: ImmersiveEditorProps) {
  const world = WORLDS[coverStyle];

  const defaultTool: ToolConfig = {
    id: world.tools[0].id,
    color: world.tools[0].color ?? world.textStyle.color,
    size: world.tools[0].size ?? 3,
    opacity: world.tools[0].opacity ?? 1,
    custom: {},
  };

  const { state, actions } = useEditorStore(
    coverStyle,
    defaultTool,
    world.canvasEnabled ? "draw" : "text",
    diaryId,
  );

  // Refs
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const worldRef = useRef<WorldComponentHandle>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  // Lazy world component
  const worldComp = useLazyWorld(coverStyle);
  const WorldComp = worldComp?.C ?? null;

  // Drawing pointer (extracted hook)
  const { handlePointerDown, handlePointerMove, handlePointerUp } =
    useDrawingPointer(coverStyle, state, actions, worldRef);

  // ── Canvas size ──
  useEffect(() => {
    function measure() {
      if (wrapRef.current) {
        const rect = wrapRef.current.getBoundingClientRect();
        setCanvasSize({ w: Math.round(rect.width), h: Math.round(Math.max(rect.height, 400)) });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // ── Text auto-resize ──
  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = "auto";
      textRef.current.style.height = `${textRef.current.scrollHeight}px`;
    }
  }, [value]);

  // ── Sync text ──
  useEffect(() => {
    if (state.plainText !== value) actions.setText(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // ── Sound mute sync ──
  useEffect(() => { setMuted(!state.soundEnabled); }, [state.soundEnabled]);

  // ── Re-render strokes on undo/redo ──
  useEffect(() => {
    worldRef.current?.renderer?.renderAll(state.strokes);
  }, [state.strokes]);

  // ── Tool selection ──
  const handleSelectTool = useCallback(
    (toolId: ToolType) => {
      const toolDef = world.tools.find((t) => t.id === toolId);
      if (!toolDef) return;
      actions.setTool({
        id: toolDef.id,
        color: toolDef.color ?? world.textStyle.color,
        size: toolDef.size ?? 3,
        opacity: toolDef.opacity ?? 1,
        custom: {},
      });
    },
    [world, actions],
  );

  // ── Keyboard shortcuts ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) actions.redo();
        else actions.undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onSubmit?.();
      }
    },
    [actions, onSubmit],
  );

  // ── Text change ──
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      actions.setText(text);
      onChange(text);
      playSound(coverStyle, "type");
    },
    [actions, onChange, coverStyle],
  );

  return (
    <div
      className={`immersive-editor immersive-editor--${coverStyle}`}
      style={{ background: world.bgStyle.background, position: "relative", borderRadius: "16px", overflow: "hidden" }}
      onKeyDown={handleKeyDown}
    >
      {world.bgStyle.texture && (
        <div className={`immersive-editor__texture immersive-editor__texture--${world.bgStyle.texture}`} aria-hidden />
      )}

      <EditorHeader
        coverStyle={coverStyle}
        editorMode={state.editorMode}
        onModeChange={actions.setMode}
        saveStatus={state.saveStatus}
        canvasEnabled={world.canvasEnabled}
      />

      <div ref={wrapRef} className="immersive-editor__body">
        <div className="immersive-editor__text-layer" style={{ display: state.editorMode === "text" ? "block" : "none" }}>
          <textarea
            ref={textRef}
            value={value}
            onChange={handleTextChange}
            placeholder={world.textStyle.placeholder}
            className="immersive-editor__textarea"
            style={{
              fontFamily: world.textStyle.fontFamily,
              fontSize: world.textStyle.fontSize,
              lineHeight: world.textStyle.lineHeight,
              color: world.textStyle.color,
            }}
            rows={8}
          />
        </div>

        {world.canvasEnabled && state.editorMode === "draw" && (
          <div
            className="immersive-editor__canvas-layer"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ touchAction: "none", WebkitUserSelect: "none" }}
          >
            {WorldComp ? (
              <WorldComp ref={worldRef} width={canvasSize.w} height={canvasSize.h} devicePixelRatio={dpr} />
            ) : (
              <div className="immersive-editor__loading"><span>세계를 불러오는 중…</span></div>
            )}
          </div>
        )}
      </div>

      <EditorToolbar
        tools={world.tools}
        selectedTool={state.selectedTool.id}
        onSelectTool={handleSelectTool}
        onUndo={actions.undo}
        onRedo={actions.redo}
        canUndo={actions.canUndo}
        canRedo={actions.canRedo}
        soundEnabled={state.soundEnabled}
        onToggleSound={actions.toggleSound}
        worldId={coverStyle}
      />
    </div>
  );
}
