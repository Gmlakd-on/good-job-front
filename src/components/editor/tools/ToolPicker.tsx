"use client";

import type { EditorTool, ToolType } from "@/lib/editor/editorTypes";

interface ToolPickerProps {
  tools: EditorTool[];
  selected: ToolType;
  onSelect: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  worldId: string;
}

export default function ToolPicker({
  tools,
  selected,
  onSelect,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  worldId,
}: ToolPickerProps) {
  return (
    <div className={`tool-picker tool-picker--${worldId}`}>
      <div className="tool-picker__tools">
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelect(tool.id)}
            className={`tool-picker__btn ${selected === tool.id ? "active" : ""} tool-picker__btn--${tool.category}`}
            title={tool.label}
          >
            <span className="tool-picker__icon">{tool.icon}</span>
            <span className="tool-picker__label">{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="tool-picker__actions">
        <button type="button" onClick={onUndo} disabled={!canUndo} className="tool-picker__action" title="되돌리기">
          ↩
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo} className="tool-picker__action" title="다시하기">
          ↪
        </button>
      </div>
    </div>
  );
}
