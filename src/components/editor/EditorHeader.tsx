"use client";

import type { CoverStyleId } from "@/components/book-ui/bookTypes";
import type { SaveStatus } from "@/lib/editor/autoSave";
import { WORLDS } from "@/lib/editor/editorTypes";

interface EditorHeaderProps {
  coverStyle: CoverStyleId;
  editorMode: "text" | "draw";
  onModeChange: (mode: "text" | "draw") => void;
  saveStatus: SaveStatus;
  canvasEnabled: boolean;
}

const STATUS_LABELS: Record<SaveStatus, string> = {
  idle: "",
  saving: "저장 중…",
  saved: "저장됨 ✓",
  error: "저장 실패",
};

export default function EditorHeader({
  coverStyle,
  editorMode,
  onModeChange,
  saveStatus,
  canvasEnabled,
}: EditorHeaderProps) {
  const world = WORLDS[coverStyle];

  return (
    <div className="editor-header">
      <span className="editor-header__world-label">{world.label}</span>

      {canvasEnabled && (
        <div className="editor-header__mode-toggle">
          <button
            type="button"
            onClick={() => onModeChange("text")}
            className={`editor-header__mode-btn${editorMode === "text" ? " editor-header__mode-btn--active" : ""}`}
            aria-label="텍스트 모드"
          >
            글
          </button>
          <button
            type="button"
            onClick={() => onModeChange("draw")}
            className={`editor-header__mode-btn${editorMode === "draw" ? " editor-header__mode-btn--active" : ""}`}
            aria-label="그리기 모드"
          >
            그림
          </button>
        </div>
      )}

      <div className="editor-header__save-status">
        {saveStatus === "saving" && (
          <span className="editor-header__save-dot editor-header__save-dot--saving" />
        )}
        {saveStatus !== "idle" && (
          <span>{STATUS_LABELS[saveStatus]}</span>
        )}
      </div>
    </div>
  );
}
