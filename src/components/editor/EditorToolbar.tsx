"use client";

import type { EditorTool, ToolType } from "@/lib/editor/editorTypes";

interface EditorToolbarProps {
  tools: EditorTool[];
  selectedTool: string;
  onSelectTool: (toolId: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  worldId: string;
}

export default function EditorToolbar({
  tools,
  selectedTool,
  onSelectTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  soundEnabled,
  onToggleSound,
  worldId,
}: EditorToolbarProps) {
  return (
    <div className={`editor-toolbar editor-toolbar--${worldId}`}>
      {/* Tool buttons */}
      <div className="editor-toolbar__tools">
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`editor-toolbar__tool-btn${selectedTool === tool.id ? " editor-toolbar__tool-btn--selected" : ""}`}
            onClick={() => onSelectTool(tool.id)}
            aria-label={tool.label}
            title={tool.label}
            style={tool.color ? { color: tool.color } : undefined}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div className="editor-toolbar__divider" />

      {/* Actions */}
      <div className="editor-toolbar__actions">
        <button
          type="button"
          className="editor-toolbar__action-btn"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="되돌리기"
          title="되돌리기 (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          type="button"
          className="editor-toolbar__action-btn"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="다시하기"
          title="다시하기 (Ctrl+Shift+Z)"
        >
          ↪
        </button>

        <div className="editor-toolbar__divider" />

        <button
          type="button"
          className="editor-toolbar__action-btn"
          onClick={onToggleSound}
          aria-label={soundEnabled ? "소리 끄기" : "소리 켜기"}
          title={soundEnabled ? "소리 끄기" : "소리 켜기"}
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>
      </div>
    </div>
  );
}
