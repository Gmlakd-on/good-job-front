"use client";

import type { CoverStyleId } from "@/components/book-ui/bookTypes";
import { WORLDS } from "@/lib/editor/editorTypes";
import { COVER_STYLES } from "@/components/book-ui/bookTypes";

interface BookPreviewSceneProps {
  coverStyleId: CoverStyleId;
  diaryName: string;
  firstLine: string;
  onNameChange: (name: string) => void;
  onFirstLineChange: (line: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export default function BookPreviewScene({
  coverStyleId,
  diaryName,
  firstLine,
  onNameChange,
  onFirstLineChange,
  onSubmit,
  submitting,
}: BookPreviewSceneProps) {
  const world = WORLDS[coverStyleId];
  const coverMeta = COVER_STYLES.find((c) => c.id === coverStyleId);

  return (
    <div
      className="preview-scene"
      style={{ background: world.bgStyle.background }}
    >
      {/* Texture overlay */}
      {world.bgStyle.texture && (
        <div
          className={`immersive-editor__texture immersive-editor__texture--${world.bgStyle.texture}`}
          aria-hidden
        />
      )}

      <div className="preview-scene__content">
        {/* World label */}
        <div className="preview-scene__label">
          <span className="preview-scene__label-name">{world.label}</span>
          <span className="preview-scene__label-desc">{coverMeta?.description}</span>
        </div>

        <p className="preview-scene__subtitle">{world.subtitle}</p>

        {/* Diary name input */}
        <div className="preview-scene__field">
          <label className="preview-scene__field-label">기록장 이름</label>
          <input
            type="text"
            value={diaryName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={`나의 ${world.label} 기록장`}
            maxLength={40}
            className="preview-scene__input"
            style={{
              fontFamily: world.textStyle.fontFamily,
              color: world.textStyle.color,
            }}
          />
        </div>

        {/* First line input */}
        <div className="preview-scene__field">
          <label className="preview-scene__field-label">오늘의 한 줄</label>
          <textarea
            value={firstLine}
            onChange={(e) => onFirstLineChange(e.target.value)}
            placeholder="기록은 이 한 줄에서 시작돼요…"
            rows={3}
            maxLength={200}
            className="preview-scene__textarea"
            style={{
              fontFamily: world.textStyle.fontFamily,
              fontSize: world.textStyle.fontSize,
              lineHeight: world.textStyle.lineHeight,
              color: world.textStyle.color,
            }}
          />
        </div>

        {/* CTA */}
        <button
          className="preview-scene__cta"
          onClick={onSubmit}
          disabled={submitting || !diaryName.trim()}
        >
          {submitting ? "만드는 중…" : "내 기록장 만들기"}
        </button>
      </div>
    </div>
  );
}
