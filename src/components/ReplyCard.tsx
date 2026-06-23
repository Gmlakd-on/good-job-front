"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { PERSONAS } from "@/types";
import type { DoodleType, DoodleIntensity } from "@/types";
import GoodJobStamp from "./GoodJobStamp";
import TypingText from "./TypingText";
import DoodleRenderer from "./doodles/DoodleRenderer";

interface ReplyCardProps {
  content: string;
  persona?: string;
  showStamp?: boolean;
  animate?: boolean;
  doodleType?: DoodleType;
  doodleText?: string;
  doodleIntensity?: DoodleIntensity;
}

export default function ReplyCard({
  content,
  persona = "soonja_grandma",
  showStamp = true,
  animate = false,
  doodleType,
  doodleText,
  doodleIntensity = "normal",
}: ReplyCardProps) {
  const [copied, setCopied] = useState(false);
  const [typingDone, setTypingDone] = useState(!animate);

  const personaData = useMemo(
    () => PERSONAS.find((p) => p.code === persona) || PERSONAS[0],
    [persona]
  );

  const theme = personaData.theme;

  const doodleTypes: DoodleType[] = useMemo(() => {
    if (doodleType) return [doodleType];
    return theme.doodleTypes;
  }, [doodleType, theme.doodleTypes]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard API 없어도 읽기는 가능 */
    }
  };

  const readingMessages: Record<string, string> = {
    operator_voice: "참이가 직접 읽고 남긴 답글",
    soonja_grandma: "순자 할머니가 읽고 남긴 흔적",
    nabi_cat: "나비가 발자국을 남겼다냥",
    warm_teacher: "선생님이 읽고 남긴 메모",
    geonneomal_grandpa: "할아버지가 읽고 남긴 한마디",
    sharon_director: "샤론 원장님이 남긴 쪽지",
  };

  const readingMsg = readingMessages[persona] || `${personaData.name}이(가) 남긴 흔적`;

  return (
    <div className="animate-envelope-open">
      {/* Physical note wrapper */}
      <div
        className="relative overflow-hidden reply-paper"
        style={{
          padding: "28px 24px 24px",
          background: theme.replyBg,
          border: `1px solid ${theme.replyBorder}`,
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Top edge — like a torn or aged paper edge */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: "2px",
            background: `linear-gradient(90deg, ${theme.replyAccent}40, ${theme.replyAccent}20, transparent 80%)`,
          }}
        />

        {/* Who left this note */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p
              className="font-serif text-base font-semibold"
              style={{ color: theme.replyInk, letterSpacing: "-0.02em" }}
            >
              {readingMsg}
            </p>
            <p
              className="mt-1 inline-flex items-center gap-1.5 text-xs"
              style={{ color: theme.replyInk }}
            >
              <Image
                src={personaData.imageSrc}
                alt=""
                width={20}
                height={20}
                className="rounded-full object-cover"
                sizes="20px"
                aria-hidden="true"
              />
              {personaData.name}
            </p>
          </div>
          {typingDone && (
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs px-2 py-1 transition-opacity"
              style={{
                color: theme.replyInk,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
              aria-label="답글 복사"
            >
              {copied ? "복사됨" : "복사"}
            </button>
          )}
        </div>

        {/* The reply itself — handwritten-feel */}
        <div
          className="whitespace-pre-line leading-[1.9]"
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "14px",
            color: theme.replyInk,
          }}
        >
          {animate && !typingDone ? (
            <TypingText text={content} speed={35} onComplete={() => setTypingDone(true)} />
          ) : (
            content
          )}
        </div>

        {/* Doodles — traces left behind */}
        {typingDone && (
          <DoodleRenderer
            types={doodleTypes}
            color={theme.replyInk}
            intensity={doodleIntensity}
            text={doodleText}
          />
        )}

        {/* Stamp — seal of acknowledgment */}
        {showStamp && typingDone && (
          <div className="mt-6 flex justify-end">
            <GoodJobStamp caption="답글 확인 완료" />
          </div>
        )}
      </div>
    </div>
  );
}
