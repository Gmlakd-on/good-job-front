"use client";

import type { EditorTool, ToolType } from "@/lib/editor/editorTypes";
import { getKitschStickers } from "./worlds/pop-kitsch/stickerSystem";

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
  selectedStickerId?: string;
  onSelectSticker?: (stickerId: string) => void;
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
  selectedStickerId = "heart",
  onSelectSticker,
}: EditorToolbarProps) {
  const showStickerPicker = worldId === "2000" && selectedTool === "sticker_stamp";
  const stickerOptions = showStickerPicker ? getKitschStickers() : [];

  return (
    <div className="editor-toolbar-shell">
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

      {showStickerPicker && (
        <div className="editor-toolbar__sticker-picker" aria-label="키치 스티커 선택">
          {stickerOptions.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              className={`editor-toolbar__sticker-btn${selectedStickerId === sticker.id ? " editor-toolbar__sticker-btn--selected" : ""}`}
              onClick={() => onSelectSticker?.(sticker.id)}
              aria-label={`${sticker.label} 스티커`}
              title={`${sticker.label} 스티커`}
            >
              <span aria-hidden="true">{sticker.emoji}</span>
              <span>{sticker.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
