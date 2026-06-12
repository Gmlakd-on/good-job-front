"use client";

/**
 * 메인 페이지 체험하기.
 * 로그인 전에도 서비스 흐름(표지 고르기 → 한 줄 적기 → 답장 받기)을 30초 안에 느끼게 한다.
 * 체험 내용은 저장하지 않고, 서버 AI도 호출하지 않는다.
 */
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CoverShelf from "@/components/book-ui/CoverShelf";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import type { CoverStyleId } from "@/components/book-ui/bookTypes";

type DemoPersona = "soonja_grandma" | "nabi_cat" | "sharon_director";
type Mood = "angry" | "sad" | "tired" | "happy" | "default";

interface DemoPersonaDef {
  id: DemoPersona;
  imageSrc: string;
  nameKey: DictKey;
  taglineKey: DictKey;
}

const PERSONAS: DemoPersonaDef[] = [
  {
    id: "soonja_grandma",
    imageSrc: "/personas/soonja_grandma.png",
    nameKey: "try.persona.soonja.name",
    taglineKey: "try.persona.soonja.tagline",
  },
  {
    id: "nabi_cat",
    imageSrc: "/personas/nabi_cat.png",
    nameKey: "try.persona.nabi.name",
    taglineKey: "try.persona.nabi.tagline",
  },
  {
    id: "sharon_director",
    imageSrc: "/personas/sharon_director.png",
    nameKey: "try.persona.sharon.name",
    taglineKey: "try.persona.sharon.tagline",
  },
];

const REPLY_KEYS: Record<DemoPersona, Record<Mood, DictKey>> = {
  soonja_grandma: {
    angry: "try.reply.soonja.angry",
    sad: "try.reply.soonja.sad",
    tired: "try.reply.soonja.tired",
    happy: "try.reply.soonja.happy",
    default: "try.reply.soonja.default",
  },
  nabi_cat: {
    angry: "try.reply.nabi.angry",
    sad: "try.reply.nabi.sad",
    tired: "try.reply.nabi.tired",
    happy: "try.reply.nabi.happy",
    default: "try.reply.nabi.default",
  },
  sharon_director: {
    angry: "try.reply.sharon.angry",
    sad: "try.reply.sharon.sad",
    tired: "try.reply.sharon.tired",
    happy: "try.reply.sharon.happy",
    default: "try.reply.sharon.default",
  },
};

// 안전 필터 — 체험에서도 가벼운 위로로 넘기지 않는다.
const CRITICAL_PATTERNS = [
  /죽고\s*싶/i,
  /자살/i,
  /목숨을\s*끊/i,
  /끝내고\s*싶/i,
  /사라지고\s*싶/i,
  /kill\s+myself/i,
  /suicide/i,
  /want\s+to\s+die/i,
  /end\s+it\s+all/i,
  /disappear\s+forever/i,
];

function detectMood(text: string): Mood {
  if (/(빡쳤|열받|짜증|어이없|억울|화나|화났|angry|mad|annoyed|frustrated|furious)/i.test(text)) return "angry";
  if (/(슬프|슬펐|눈물|외로|허전|우울|서럽|보고\s*싶|sad|lonely|depressed|empty|miss)/i.test(text)) return "sad";
  if (/(피곤|지쳤|지친|힘들|버겁|못\s*버티|방전|졸려|tired|exhausted|drained|burnt\s*out|overwhelmed)/i.test(text)) return "tired";
  if (/(좋았|행복|뿌듯|설레|기뻤|신났|웃었|happy|proud|excited|glad|joy)/i.test(text)) return "happy";
  return "default";
}

export default function TryItDemo() {
  const { t } = useI18n();
  const [cover, setCover] = useState<CoverStyleId>("archive");
  const [persona, setPersona] = useState<DemoPersona>("soonja_grandma");
  const [text, setText] = useState("");
  const [reply, setReply] = useState<{ content: string; isSafety: boolean } | null>(null);
  const [thinking, setThinking] = useState(false);

  const personaInfo = useMemo(() => PERSONAS.find((p) => p.id === persona)!, [persona]);
  const personaName = t(personaInfo.nameKey);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const isCritical = CRITICAL_PATTERNS.some((pattern) => pattern.test(trimmed));
    setThinking(true);
    setReply(null);

    // 잠깐의 '읽는 시간' 연출 후 답장 표시
    window.setTimeout(() => {
      if (isCritical) {
        setReply({ content: t("try.safetyMessage"), isSafety: true });
      } else {
        const replyKey = REPLY_KEYS[persona][detectMood(trimmed)];
        setReply({ content: t(replyKey), isSafety: false });
      }
      setThinking(false);
    }, 900);
  };

  return (
    <section className="try-demo section" aria-label={t("try.aria")}>
      <div className="main-container try-demo__inner">
        <p className="try-demo__eyebrow section-eyebrow">{t("try.eyebrow")}</p>
        <h2 className="try-demo__title section-title">{t("try.title")}</h2>
        <p className="try-demo__sub section-description">{t("try.description")}</p>

        <div className="try-demo__step">
          <span className="try-demo__step-label">{t("try.step.cover")}</span>
          <CoverShelf selected={cover} onSelect={setCover} />
        </div>

        <div className="try-demo__step">
          <span className="try-demo__step-label">{t("try.step.write")}</span>
          <div className="try-demo__personas reply-character-grid" role="radiogroup" aria-label={t("try.personaAria")}>
            {PERSONAS.map((p) => {
              const name = t(p.nameKey);
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={persona === p.id}
                  className={`try-demo__persona reply-character-card ${persona === p.id ? "try-demo__persona--active" : ""}`}
                  onClick={() => setPersona(p.id)}
                >
                  <span className="try-demo__persona-icon">
                    <Image
                      src={p.imageSrc}
                      alt=""
                      width={44}
                      height={44}
                      className="rounded-full object-cover"
                      sizes="44px"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="try-demo__persona-name reply-character-name">{name}</span>
                  <span className="try-demo__persona-tag reply-character-description">{t(p.taglineKey)}</span>
                </button>
              );
            })}
          </div>
          <textarea
            className="try-demo__textarea diary-textarea"
            rows={3}
            maxLength={300}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("try.textarea.placeholder")}
            aria-label={t("try.textarea.aria")}
          />
          <button
            type="button"
            className="try-demo__submit cta-button"
            disabled={!text.trim() || thinking}
            onClick={handleSubmit}
          >
            {thinking ? t("try.thinking", { name: personaName }) : t("try.submit")}
          </button>
        </div>

        {reply && (
          <div
            className={`try-demo__reply ${reply.isSafety ? "try-demo__reply--safety" : ""}`}
            role="status"
          >
            {!reply.isSafety && (
              <p className="try-demo__reply-from">
                <Image
                  src={personaInfo.imageSrc}
                  alt=""
                  width={20}
                  height={20}
                  className="rounded-full object-cover"
                  sizes="20px"
                  aria-hidden="true"
                />
                {t("try.replyFrom", { name: personaName })}
              </p>
            )}
            <p className="try-demo__reply-text">{reply.content}</p>
            {!reply.isSafety && (
              <p className="try-demo__reply-note">
                {t("try.replyNote")}
              </p>
            )}
          </div>
        )}

        <div className="try-demo__cta-row">
          <Link href="/auth?mode=signup" className="try-demo__cta">
            {t("try.createBook")}
          </Link>
        </div>
      </div>
    </section>
  );
}
