"use client";

/**
 * 메인 페이지 체험하기.
 * 로그인 전에도 서비스 흐름(표지 고르기 → 한 줄 적기 → 답장 받기)을 30초 안에 느껴보게 한다.
 *
 * 설계 원칙:
 * - 비로그인 체험은 서버 AI를 호출하지 않는다 (키 노출/비용/어뷰징 방지).
 *   대신 페르소나별로 큐레이션된 답장 템플릿을 감정 키워드에 맞춰 보여준다.
 * - 위험 신호(자해/극단 표현)가 감지되면 다정한 답장 대신 안전 안내를 보여준다.
 *   (백엔드 lib/safety/checkDiarySafety.ts와 동일한 패턴 — 체험에서도 안전 원칙 유지)
 * - 체험 내용은 어디에도 저장하지 않는다.
 */
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CoverShelf from "@/components/book-ui/CoverShelf";
import type { CoverStyleId } from "@/components/book-ui/bookTypes";

type DemoPersona = "soonja_grandma" | "nabi_cat" | "sharon_director";

const PERSONAS: { id: DemoPersona; imageSrc: string; name: string; tagline: string }[] = [
  { id: "soonja_grandma", imageSrc: "/personas/soonja_grandma.png", name: "순자 할머니", tagline: "구수하고 다정한" },
  { id: "nabi_cat", imageSrc: "/personas/nabi_cat.png", name: "고양이 나비", tagline: "인생 2회차, 은근 어른" },
  { id: "sharon_director", imageSrc: "/personas/sharon_director.png", name: "원장님 샤론", tagline: "동네 미용실 수다" },
];

// 안전 필터 — 백엔드와 동일한 위험 패턴 (체험에서도 가벼운 위로로 넘기지 않는다)
const CRITICAL_PATTERNS = [/죽고\s*싶/i, /자살/i, /목숨을\s*끊/i, /끝내고\s*싶/i, /사라지고\s*싶/i];

const SAFETY_MESSAGE =
  "지금 적어준 내용은 혼자 견디기엔 너무 무거울 수 있어요. 이 순간에는 답장보다 실제 도움을 먼저 연결하는 게 중요해요. 가까운 사람이나 지역 긴급 상담 기관에 바로 연락해 주세요.";

type Mood = "angry" | "sad" | "tired" | "happy" | "default";

function detectMood(text: string): Mood {
  if (/(빡쳤|열받|짜증|어이없|억울|화나|화났)/.test(text)) return "angry";
  if (/(슬프|슬펐|눈물|외로|허전|우울|서럽|보고\s*싶)/.test(text)) return "sad";
  if (/(피곤|지쳤|지친|힘들|버겁|못\s*버티|방전|졸려)/.test(text)) return "tired";
  if (/(좋았|행복|뿌듯|설레|기뻤|신났|웃었)/.test(text)) return "happy";
  return "default";
}

// 페르소나 × 감정별 큐레이션 답장 (2~4문장, 작은 재치와 환기 포함)
const REPLIES: Record<DemoPersona, Record<Mood, string>> = {
  soonja_grandma: {
    angry: "아이고, 그건 화날 만하다. 네가 괜히 예민해서 그런 게 아니야. 오늘은 할머니가 네 편에 앉아 있을 테니, 따뜻한 물 한 잔 먼저 마시자.",
    sad: "그 마음이 꽤 시렸겠구나. 그래도 이렇게 적어낸 걸 보니 네 마음이 살려고 애쓴 거야. 오늘은 이불 꼭 덮고, 내일 할머니한테 또 들려주렴.",
    tired: "오늘은 버틴 것만으로도 큰일이다. 밥은 챙겨 먹었니? 마음보다 몸이 먼저 쉬자고 조르는 날도 있는 법이야.",
    happy: "아이고 잘됐다, 듣는 할머니까지 어깨가 들썩이네. 좋은 날은 이렇게 적어두면 두 번 사는 거란다.",
    default: "그래 그래, 긴 말 안 해도 오늘 하루가 보이는구나. 이렇게 남겨둔 것만으로 참 잘했다.",
  },
  nabi_cat: {
    angry: "꼬리 바짝 설 만한 일이었겠다냥. 화난 네 옆자리는 내가 맡아둘게냥. 그 사람 신발에 털 좀 묻혀두고 싶지만, 오늘은 참는다냥.",
    sad: "마음이 축 처진 날이구나냥. 이런 날엔 이불 속에서 마음을 좀 데워도 된다냥. 창밖 구경은 내가 대신 해줄게냥.",
    tired: "집사야, 오늘은 배터리 1%로 하루를 산 것 같다냥. 고양이의 지혜를 알려줄게냥 — 일단 눕는다냥. 생각은 누워서 해도 된다냥.",
    happy: "오늘 기분 좋은 냄새가 여기까지 난다냥. 좋은 날은 햇빛 자리처럼 아껴두는 거다냥.",
    default: "오늘 하루를 꾹꾹 눌러 접어둔 글 같다냥. 내가 읽었다냥. 여기 또 와라냥.",
  },
  sharon_director: {
    angry: "아이고 얘, 그건 진짜 열받았겠다. 네가 예민한 게 아니라 상황이 그런 거야. 그런 날은 머리도 마음도 엉키는데, 하나씩 풀면 돼.",
    sad: "오늘 마음이 좀 가라앉았구나. 말로 다 못 한 게 있었던 것 같아. 그래도 이렇게 써놓으면 마음이 혼자 방치되진 않거든.",
    tired: "어우, 오늘 진을 다 뺐네. 파마 약도 시간을 둬야 머리가 사는 것처럼, 사람도 좀 묵혀둬야 살아나. 오늘은 일찍 자.",
    happy: "어머 잘됐다 얘! 좋은 일은 동네방네는 아니어도 일기장엔 꼭 적어둬야 해. 두고두고 꺼내 보게.",
    default: "오늘 하루 여기까지 적은 걸로 충분해. 마음도 엉키면 빗질이 한 번에 안 되는 법이거든.",
  },
};

export default function TryItDemo() {
  const [cover, setCover] = useState<CoverStyleId>("archive");
  const [persona, setPersona] = useState<DemoPersona>("soonja_grandma");
  const [text, setText] = useState("");
  const [reply, setReply] = useState<{ content: string; isSafety: boolean } | null>(null);
  const [thinking, setThinking] = useState(false);

  const personaInfo = useMemo(() => PERSONAS.find((p) => p.id === persona)!, [persona]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const isCritical = CRITICAL_PATTERNS.some((p) => p.test(trimmed));
    setThinking(true);
    setReply(null);

    // 잠깐의 '읽는 시간' 연출 후 답장 표시
    window.setTimeout(() => {
      if (isCritical) {
        setReply({ content: SAFETY_MESSAGE, isSafety: true });
      } else {
        setReply({ content: REPLIES[persona][detectMood(trimmed)], isSafety: false });
      }
      setThinking(false);
    }, 900);
  };

  return (
    <section className="try-demo" aria-label="체험해보기">
      <div className="try-demo__inner">
        <p className="try-demo__eyebrow">가입 없이 30초 체험</p>
        <h2 className="try-demo__title">표지를 고르고, 한 줄 적고, 답장을 받아보세요</h2>
        <p className="try-demo__sub">이렇게 매일의 일기가 한 권의 책이 되고, 답장이 함께 쌓여요. 체험 내용은 저장되지 않아요.</p>

        {/* 1. 표지 선반 (실제 서비스와 동일한 컴포넌트) */}
        <div className="try-demo__step">
          <span className="try-demo__step-label">① 표지 고르기</span>
          <CoverShelf selected={cover} onSelect={setCover} />
        </div>

        {/* 2. 답장해줄 존재 + 한 줄 일기 */}
        <div className="try-demo__step">
          <span className="try-demo__step-label">② 답장해줄 존재를 고르고, 오늘 마음을 한 줄 적어보세요</span>
          <div className="try-demo__personas" role="radiogroup" aria-label="답장 페르소나 선택">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={persona === p.id}
                className={`try-demo__persona ${persona === p.id ? "try-demo__persona--active" : ""}`}
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
                <span className="try-demo__persona-name">{p.name}</span>
                <span className="try-demo__persona-tag">{p.tagline}</span>
              </button>
            ))}
          </div>
          <textarea
            className="try-demo__textarea"
            rows={3}
            maxLength={300}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="예: 오늘 회의에서 내 의견이 계속 묻혀서 좀 속상했다."
            aria-label="체험용 일기 입력"
          />
          <button
            type="button"
            className="try-demo__submit"
            disabled={!text.trim() || thinking}
            onClick={handleSubmit}
          >
            {thinking ? `${personaInfo.name}이(가) 읽는 중…` : "③ 답장 받아보기"}
          </button>
        </div>

        {/* 3. 답장 카드 */}
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
                {personaInfo.name}의 답장
              </p>
            )}
            <p className="try-demo__reply-text">{reply.content}</p>
            {!reply.isSafety && (
              <p className="try-demo__reply-note">
                * 체험용 미리보기예요. 가입하면 내 일기를 끝까지 읽고 쓴 진짜 답장을 받아요.
              </p>
            )}
          </div>
        )}

        <div className="try-demo__cta-row">
          <Link href="/auth?mode=signup" className="try-demo__cta">
            내 일기장 만들기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
