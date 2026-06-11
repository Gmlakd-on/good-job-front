"use client";

import { useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { DIARY_QUESTIONS } from "@/lib/classroomCopy";

interface DiaryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  maxLength?: number;
}

export default function DiaryEditor({ value, onChange, onSubmit, maxLength = 3000 }: DiaryEditorProps) {
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions] = useState(() => {
    const shuffled = [...DIARY_QUESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  });

  const insertQuestion = (question: string) => {
    const prefix = value ? `${value}\n\n` : "";
    onChange(`${prefix}${question}\n`);
    setShowQuestions(false);
  };

  return (
    <div className="notebook-card p-5">
      <span className="paper-tape" aria-hidden />
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-serif text-lg" style={{ color: "var(--deep-gray)" }}>
            책상 위 일기장
          </p>
          <p className="font-hand text-sm opacity-50">길지 않아도 돼요. 오늘 남은 장면만 적어도 충분해요.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowQuestions(!showQuestions)}
          className="school-tag rounded-full px-3 py-1 text-xs transition-transform hover:-rotate-2"
        >
          쪽지 질문
        </button>
      </div>

      {showQuestions && (
        <div className="mb-3 flex flex-col gap-2 animate-fade-in-up">
          {questions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => insertQuestion(question)}
              className="school-tag rounded-lg p-2 text-left text-sm transition-transform hover:-rotate-1"
            >
              {question}
            </button>
          ))}
        </div>
      )}

      <textarea
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
          if (event.target.value.length <= maxLength) {
            onChange(event.target.value);
          }
        }}
        onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && value.trim() && onSubmit) {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder="예: 오늘은 복도 끝 창문처럼 마음이 조금 서늘했다. 그래도 누가 읽어줬으면 해서 적어둔다."
        className="diary-lines w-full min-h-[220px] resize-none bg-transparent text-base leading-8 outline-none placeholder:opacity-35"
        style={{
          fontFamily: "'Noto Sans KR', sans-serif",
          fontSize: "16px",
          color: "var(--deep-gray)",
        }}
      />

      <div className="mt-2 flex justify-between">
        {onSubmit && <span className="text-xs opacity-35">⌘/Ctrl + Enter로 답글 받기</span>}
        <span className="ml-auto text-xs opacity-45">
          {value.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}
